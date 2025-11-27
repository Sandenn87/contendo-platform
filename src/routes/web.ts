import { Router, Request, Response } from 'express';
import express from 'express';
import path from 'path';

const router = Router();

// Serve the main web application
router.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Serve static assets
router.use('/css', express.static(path.join(__dirname, '../../public/css')));
router.use('/js', express.static(path.join(__dirname, '../../public/js')));
router.use('/images', express.static(path.join(__dirname, '../../public/images')));

export default router;
