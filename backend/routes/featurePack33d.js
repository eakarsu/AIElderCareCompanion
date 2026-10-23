"use strict";
const express=require("express");
const authMiddleware=require('../middleware/auth');
const svc=require("../services/featurePack33d");
function ownerOf(req){ return req.user?.id || req.user?.userId || req.userId; }
function createRouter(auth,store=svc.defaultStore){ const router=express.Router(); router.use(auth);
 router.get("/tasks/export",(req,res)=>{ const tasks=svc.listTasks(store,ownerOf(req),req.query); if(String(req.query.format||"json").toLowerCase()==="csv"){ res.set({"Content-Type":"text/csv","Content-Disposition":'attachment; filename="tasks.csv"'}); return res.send(svc.toCSV(tasks)); } return res.json({exportedAt:new Date().toISOString(),count:tasks.length,data:tasks}); });
 router.get("/tasks",(req,res)=>{ const tasks=svc.listTasks(store,ownerOf(req),req.query); res.json({data:tasks,count:tasks.length}); });
 router.post("/tasks",(req,res)=>{ try{ return res.status(201).json(svc.createTask(store,ownerOf(req),req.body||{})); }catch(e){ return res.status(e.status||400).json({error:e.message}); } });
 router.put("/tasks/:id",(req,res)=>{ try{ const t=svc.updateTask(store,ownerOf(req),req.params.id,req.body||{}); if(!t) return res.status(404).json({error:"task not found"}); return res.json(t); }catch(e){ return res.status(e.status||400).json({error:e.message}); } });
 router.patch("/tasks/:id",(req,res)=>{ try{ const t=svc.updateTask(store,ownerOf(req),req.params.id,req.body||{}); if(!t) return res.status(404).json({error:"task not found"}); return res.json(t); }catch(e){ return res.status(e.status||400).json({error:e.message}); } });
 router.get("/ai/features",(req,res)=>res.json({features:svc.FEATURES,aiGenerated:false,providerConfigured:svc.hasProviderKey()}));
 router.post("/ai/:feature",async(req,res)=>{ const tasks=svc.listTasks(store,ownerOf(req),{}); const one=req.body&&req.body.taskId?tasks.filter(t=>String(t.id)===String(req.body.taskId)):tasks; return res.json(await svc.runAi(req.params.feature,one)); });
 return router; }
module.exports=createRouter(authMiddleware); module.exports.createRouter=createRouter;
