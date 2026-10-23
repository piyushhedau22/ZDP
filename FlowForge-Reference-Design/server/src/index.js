import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { Resend } from 'resend';
const app=express();
const PORT=Number(process.env.PORT||4000);
app.use(cors({origin:(process.env.CLIENT_ORIGIN||'http://localhost:5173').split(',').map(x=>x.trim())}));
app.use(express.json({limit:'1mb'}));
const workflowSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},nodes:{type:Array,default:[]},edges:{type:Array,default:[]}}, {timestamps:true});
const logSchema=new mongoose.Schema({at:{type:Date,default:Date.now},level:{type:String,default:'info'},message:String},{_id:false});
const runSchema=new mongoose.Schema({workflowId:{type:mongoose.Schema.Types.ObjectId,ref:'Workflow'},workflowName:String,status:{type:String,default:'running'},logs:{type:[logSchema],default:[]},startedAt:{type:Date,default:Date.now},finishedAt:Date},{timestamps:true});
const userSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},phone:{type:String,required:true,unique:true,trim:true},
passwordHash: { type: String, required: true },
resetTokenHash: { type: String, default: null },
resetTokenExpires: { type: Date, default: null },
}, { timestamps: true });
const User=mongoose.model('User',userSchema);
const Workflow=mongoose.model('Workflow',workflowSchema); const Run=mongoose.model('Run',runSchema);
const JWT_SECRET=process.env.JWT_SECRET||'change-this-development-secret-before-deploying';
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

  console.log('RESEND_API_KEY loaded:', Boolean(process.env.RESEND_API_KEY));
console.log('RESEND_FROM_EMAIL loaded:', Boolean(process.env.RESEND_FROM_EMAIL));
function makeToken(user){return jwt.sign({sub:user._id.toString(),email:user.email,name:user.name},JWT_SECRET,{expiresIn:'7d'});}
app.post('/api/auth/signup',async(req,res,next)=>{try{const name=String(req.body?.name||'').trim();const email=String(req.body?.email||'').trim().toLowerCase();const phone=String(req.body?.phone||'').trim().replace(/[\s()-]/g,'');const password=String(req.body?.password||'');if(name.length<2)return res.status(400).json({error:'Please enter your full name.'});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Please enter a valid email address.'});if(!/^\+?[0-9]{10,15}$/.test(phone))return res.status(400).json({error:'Please enter a valid phone number (10–15 digits).'});if(password.length<8)return res.status(400).json({error:'Password must be at least 8 characters.'});if(await User.findOne({$or:[{email},{phone}]}))return res.status(409).json({error:'An account with this email or phone already exists. Please sign in.'});const passwordHash=await bcrypt.hash(password,12);const user=await User.create({name,email,phone,passwordHash});res.status(201).json({token:makeToken(user),user:{id:user._id,name:user.name,email:user.email,phone:user.phone}})}catch(e){if(e.code===11000)return res.status(409).json({error:'An account with this email or phone already exists. Please sign in.'});next(e)}});
app.post('/api/auth/login',async(req,res,next)=>{try{const identifier=String(req.body?.identifier||req.body?.email||'').trim();const password=String(req.body?.password||'');const isEmail=identifier.includes('@');const normalizedPhone=identifier.replace(/[\s()-]/g,'');const user=await User.findOne(isEmail?{email:identifier.toLowerCase()}:{phone:normalizedPhone});if(!user||!(await bcrypt.compare(password,user.passwordHash)))return res.status(401).json({error:'Email/phone or password is incorrect.'});res.json({token:makeToken(user),user:{id:user._id,name:user.name,email:user.email,phone:user.phone}})}catch(e){next(e)}});


app.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'If the account exists, a reset email will be sent.'
      });
    }

    if (!resend || !process.env.RESEND_FROM_EMAIL) {
      return res.status(500).json({
        error: 'Email service is not configured.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    user.resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = new URL(
      '/',
      process.env.CLIENT_ORIGIN || 'http://localhost:5173'
    );
    resetUrl.searchParams.set('resetToken', token);

    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: 'Reset your FlowForge password',
        html: `
          <h2>Password Reset</h2>
          <p>Click below to reset your FlowForge password.</p>
          <p><a href="${resetUrl.toString()}">Reset Password</a></p>
          <p>This link expires in 15 minutes.</p>
        `
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (emailError) {
      user.resetTokenHash = null;
      user.resetTokenExpires = null;
      await user.save();
      throw emailError;
    }

    res.json({
      message: 'If the account exists, a reset email will be sent.'
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body?.token || '');
    const password = String(req.body?.password || '');

    if (!token || password.length < 8) {
      return res.status(400).json({
        error: 'Token and password of at least 8 characters are required.'
      });
    }

    const resetTokenHash = crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

    const user = await User.findOne({
      resetTokenHash,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Reset link is invalid or expired.'
      });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;

    await user.save();

    res.json({
      message: 'Password reset successfully. Please sign in.'
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/health',(_req,res)=>res.json({ok:true,service:'FlowForge API'}));
app.get('/api/workflows',async(_req,res,next)=>{try{res.json(await Workflow.find().sort({updatedAt:-1}).lean())}catch(e){next(e)}});
app.get('/api/workflows/:id',async(req,res,next)=>{try{const w=await Workflow.findById(req.params.id);if(!w)return res.status(404).json({error:'Workflow not found.'});res.json(w)}catch(e){next(e)}});
app.post('/api/workflows',async(req,res,next)=>{try{const {id,name,nodes=[],edges=[]}=req.body||{};if(!name?.trim())return res.status(400).json({error:'Workflow name is required.'});let w;if(id){w=await Workflow.findByIdAndUpdate(id,{name:name.trim(),nodes,edges},{new:true,runValidators:true});if(!w)return res.status(404).json({error:'Workflow not found.'})}else{w=await Workflow.create({name:name.trim(),nodes,edges})}res.json(w)}catch(e){next(e)}});
app.delete('/api/workflows/:id',async(req,res,next)=>{try{const w=await Workflow.findByIdAndDelete(req.params.id);if(!w)return res.status(404).json({error:'Workflow not found.'});res.json({ok:true})}catch(e){next(e)}});
app.get('/api/runs',async(_req,res,next)=>{try{res.json(await Run.find().sort({startedAt:-1}).limit(100).lean())}catch(e){next(e)}});
app.get('/api/runs/:id',async(req,res,next)=>{try{const r=await Run.findById(req.params.id).lean();if(!r)return res.status(404).json({error:'Execution not found.'});res.json(r)}catch(e){next(e)}});
app.post('/api/workflows/:id/run',async(req,res,next)=>{try{const w=await Workflow.findById(req.params.id).lean();if(!w)return res.status(404).json({error:'Save the workflow before running it.'});const run=await Run.create({workflowId:w._id,workflowName:w.name,status:'running',logs:[{level:'info',message:`Execution started for "${w.name}".`}]});res.status(202).json({runId:run._id,status:run.status});executeDemo(run._id.toString(),w)}catch(e){next(e)}});
async function executeDemo(id,w){const log=async(message,level='info')=>Run.updateOne({_id:id},{$push:{logs:{at:new Date(),level,message}}});try{for(const node of (w.nodes||[]).filter(n=>n.id!=='start'&&n.id!=='finish')){const label=node.data?.label||node.id||'Task';const retries=Math.max(0,Math.min(5,Number(node.data?.retries||0)));const failTimes=Math.max(0,Math.min(10,Number(node.data?.failTimes||0)));let attempt=0,ok=false;while(attempt<=retries&&!ok){attempt++;await log(`Running "${label}" (attempt ${attempt}/${retries+1}).`);await new Promise(r=>setTimeout(r,350));if(attempt<=failTimes){await log(`Temporary failure in "${label}".`,'warning');if(attempt<=retries)await log(`Retrying "${label}".`)}else{ok=true;await log(`"${label}" completed successfully.`,'success')}}if(!ok){await log(`"${label}" failed after retries.`,'error');await Run.updateOne({_id:id},{$set:{status:'failed',finishedAt:new Date()}});return}}await log('Workflow execution completed.','success');await Run.updateOne({_id:id},{$set:{status:'completed',finishedAt:new Date()}})}catch(e){await log(e.message||'Unexpected execution error.','error');await Run.updateOne({_id:id},{$set:{status:'failed',finishedAt:new Date()}})}}
app.use((err,_req,res,_next)=>{console.error(err);res.status(err.name==='CastError'?400:500).json({error:err.name==='CastError'?'Invalid ID.':'Server error.',details:process.env.NODE_ENV==='development'?err.message:undefined})});
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/workflow_saga').then(()=>app.listen(PORT,()=>console.log(`Workflow API running at http://localhost:${PORT}`))).catch(e=>{console.error('MongoDB connection failed:',e.message);process.exit(1)});