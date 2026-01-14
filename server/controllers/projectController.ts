import { Request , Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../config/openai.js";

export const makeRevision = async (req : Request , res : Response ) => {
    
    try {
        const userId = req.userId;
        const {projectId} = req.params;
        const {message} = req.body ;
        
        const user = await prisma.user.findUnique({
            where : {
                id : userId
            }
        })
        if(!userId || !user ){
            return res.status(401).json({
                message : 'Unauthorised'
            });
        }
        if(user.credits < 2 ){
            return res.status(403).json({message : 'add more credits to make changes'});
        }
        if(!message || message.trim()=== ''){
             return res.status(400).json({message : 'enter a valid promt '});
        }
        
        const currentProject = await prisma.websiteProject.findUnique({
            where :{id : projectId , userId },
            include : {versions : true }
        })

        if(!currentProject){
            return res.status(404).json({message : 'project not found'});
        }

        await prisma.conversation.create({
            data :{
                role : 'user',
                content : message , 
                projectId
            }
        })

        await prisma.user.update({
            where : {id : userId},
            data : {
                credits : {decrement : 5}
            }
        })





        res.json({credits : user?.credits})
    }
    catch (error : any ){
        return res.status(401).json({
            message : error.message 
        });

    }
}