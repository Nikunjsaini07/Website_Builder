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

        const promptEnchanceResponse = await openai.chat.completions.create({
            model : 'z-ai/glm-4.5-air:free',
            messages:[
                {
                    role : 'system',
                    content : `You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.

                        Enhance this prompt by:
                        1. Adding specific design details (layout, color scheme, typography)
                        2. Specifying key sections and features
                        3. Describing the user experience and interactions
                        4. Including modern web design best practices
                        5. Mentioning responsive design requirements
                        6. Adding any missing but important elements

                    Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).`
                },
                {
                    role  : 'user',
                    content : `User's requesr : "${message}`
                }
            ]
        })
        const enchancedPrompt = promptEnchanceResponse.choices[0].message.content;
        await prisma.conversation.create({
            data :{
                 role : 'assistant',
                 content : `I've enchanced your prompt to : "${enchancedPrompt}"`,
                 projectId
            }
            
        })

        await prisma.conversation.create({
            data : {
                 role :'assistant' ,
                 content : 'Now making chnages to your website .. ',
                 projectId
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