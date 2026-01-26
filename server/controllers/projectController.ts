import { Request , Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../config/openai.js";

export const makeRevision = async (req : Request , res : Response ) => {
    const userId = req.userId;
    try {
        
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
        
        const codeGenerationResponse = await openai.chat.completions.create({
            model :'z-ai/glm-4.5-air:free',
            messages : [
                {
                    role: 'system',
                    content : `You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enchancedPrompt}"

                            CRITICAL REQUIREMENTS:
                            - You MUST output valid HTML ONLY. 
                            - Use Tailwind CSS for ALL styling
                            - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                            - Use Tailwind utility classes extensively for styling, animations, and responsiveness
                            - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
                            - Use modern, beautiful design with great UX using Tailwind classes
                            - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
                            - Use Tailwind animations and transitions (animate-*, transition-*)
                            - Include all necessary meta tags
                            - Use Google Fonts CDN if needed for custom fonts
                            - Use placeholder images from https://placehold.co/600x400
                            - Use Tailwind gradient classes for beautiful backgrounds
                            - Make sure all buttons, cards, and components use Tailwind styling

                            CRITICAL HARD RULES:
                            1. You MUST put ALL output ONLY into message.content.
                            2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
                            3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
                            4. Do NOT include markdown, explanations, notes, or code fences.

                            The HTML should be complete and ready to render as-is with Tailwind CSS.
                        `
                },
                {
                    role : 'user' , 
                    content : `Here is the current website code : " ${currentProject.current_code} " 
                    The user wants this change : "${enchancedPrompt}"`

                }
            ]
        })

        const code = codeGenerationResponse.choices[0].message.content || '';

        const version = await prisma.version.create({
            data : {
                code : code.replace(/```[a-z]*\n?/gi , '')
                    .replace(/```$/g , '' )
                    .trim(),
                    description : 'Chanages made ' , 
                    projectId
            }
        })
       
        await prisma.conversation.create({
             data :{
                 role : 'assistant' , 
                 content : "I'have made the chnages to your website ! You can now prevew it",
                 projectId
             }
        })
        await prisma.websiteProject.update({
            where : {id : projectId},
            data : {
                current_code : code.replace(/```[a-z]*\n?/gi , '')
                    .replace(/```$/g , '' )
                    .trim(),
                    current_version_index : version.id
            }
        })
        

        res.json({message : "Changes made successfully"})
    }
    catch (error : any ){
         await prisma.user.update({
            where : {id : userId},
            data : {
                credits : {increment : 5}
            }
        })
        return res.status(500).json({
            message : error.message 
        });

    }
}

export const rollbackToVersion= async (req : Request , res : Response ) => {
    try{
        const userId = req.userId
        if(!userId){
        return res.status(401).json({
        message: 'Unauthorised'
        });
        }   
        const {projectId , versionId} = req.params;

        const project = await prisma.websiteProject.findUnique({
            where : {id : projectId , userId} , 
            include : {versions : true }
        })

        if(!project){
            return res.status(404).json({
                message : 'Project not found'
            })
        }
        
        const version = project.versions.find((version) => version.id === versionId);

        if(!version){
             return res.status(404).json({
                 message : 'Version not found' 
             })
        }

        await prisma.websiteProject.update({
             where :{
                id : projectId , userId
             },
             data :{
                 current_code : version.code , 
                 current_version_index : version.id
             }
        })


        await prisma.conversation.create({
            data :{
                role : 'assistant',
                content : "I've rolled back your website to selected version. You can now preview it",
                projectId
            }
        })

         res.json({
            message : 'Version rolled back'
         });


          
    }
    catch(error : any){
         res.status(500).json({
             message : error.message
         });
    }
    
}

export const deleteProject = async (req : Request , res : Response ) => {
    try{
        const userId = req.userId 
        const {projectId , versionId} = req.params;

        await prisma.websiteProject.delete({
             where : {id : projectId , userId}
            
        })
        res.json({
        message : 'Project deleted successfully'
        });
     
    }
    catch(error : any){
         res.status(500).json({
             message : error.message
         });
    }
    
}

export const getProjectPreview = async (req : Request , res : Response ) => {
    try{
        const userId = req.userId 
        const {projectId , versionId} = req.params;
        if(!userId){
             return  res.status(401).json({
                message : 'Unauthorized'
             });
        }

        const project = await prisma.websiteProject.findFirst({
             where : {id : projectId , userId},
             include: {versions : true }            
        })
         
        if(!project){
             return res.status(404).json({
                message : 'Project not found'
             });
        }
        res.json({
            project
        });
     
    }
    catch(error : any){
         res.status(500).json({
             message : error.message
         });
    }
    
}

export const getPublishedProject = async (req : Request , res : Response ) => {
    try{
     
        const projects = await prisma.websiteProject.findMany({
             where : {isPublished: true },
             include: {user : true }            
        })

        res.json({
            projects
        });
     
    }
    catch(error : any){
         res.status(500).json({
             message : error.message
         });
    }
    
}












