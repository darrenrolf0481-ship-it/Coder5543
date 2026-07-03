import express from 'express';
import path from 'path';

const app = express();
const distPath = path.join(process.cwd(), 'dist');

app.use('/proxy/8900', express.static(distPath));

app.listen(3002, () => console.log('started'));
