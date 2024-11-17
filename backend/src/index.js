import express from 'express';
import {AssemblyAI} from 'assemblyai';
import multer from 'multer'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config();
const app = express();

app.use(cors())
app.use(express.json());

const upload = multer ({storage : multer.memoryStorage()})

const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY 
  })

app.get('/', (req, res) => {
    res.send('Hello World');
    }
);

app.post('/upload',upload.single('audio'),async(req,res)=>{
    try {
        console.log('Uploading audio file');
        const audioBuffer = req.file.buffer;

        const audioUrl=await client.files.upload(audioBuffer);

        const transcript = await client.transcripts.transcribe({
            audio:audioUrl,
        })

        const result = await client.transcripts.waitUntilReady(transcript.id, {
            pollingInterval: 5000,
          });

          if (result.status === 'error') {
            throw new Error(result.error);
          }
           
          console.log('Transcription complete', result.text);
          res.json({ text: result.text });

    
    }
    catch(error){
        console.log('Error Transcribing audio', error);
        res.status(500).json({error:error.message});
    }

})


app.listen(3000, () => {
    console.log('Server is running on port 3000');
    }
)
