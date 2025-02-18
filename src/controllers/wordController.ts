import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const userSessions: Record<string, string[]> = {}; // Kullanıcıya özel kelime listesi

export const getRandomWord = (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string; // Kullanıcı oturum kimliği al
    const mode = req.query.mode || "Klasik";
    const filePath = path.join(__dirname, `../data/tabuWords${mode}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "Seçilen oyun modu için veri dosyası bulunamadı!" });
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId eksik!" });
    }

    // Kullanıcı için önceden kaydedilmiş kelimeler var mı?
    if (!userSessions[sessionId]) {
      userSessions[sessionId] = [];
    }

    // Kullanıcının kullanmadığı kelimeleri filtrele
    interface WordData {
      word: string;
      banned: string[];
    }
    
    const words: WordData[] = JSON.parse(rawData); // Burada WordData tipini belirtiyoruz
    
    const availableWords = words.filter((w: WordData) => 
      !userSessions[sessionId].includes(w.word)
    );
    
    // Eğer hiç kelime kalmadıysa, listeyi sıfırla
    if (availableWords.length === 0) {
      console.warn(`Tüm kelimeler kullanıldı! Kullanıcı ${sessionId} için liste sıfırlandı.`);
      userSessions[sessionId] = [];
    }

    // Yeni kelime seç
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];

    // Kullanıcının kelime listesine ekle
    userSessions[sessionId].push(selectedWord.word);

    res.json(selectedWord);
  } catch (error) {
    console.error("Hata:", error);
    res.status(500).json({ error: "Kelime bulunamadı" });
  }
};
