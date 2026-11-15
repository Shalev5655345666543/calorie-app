// Vercel serverless function: checks the user is logged in, then asks Gemini to analyze the meal photo.
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY } = process.env;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const u = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: SUPABASE_ANON_KEY },
    });
    if (!u.ok) return res.status(401).json({ error: "לא מחובר" });

    const { image, mime, note } = req.body || {};
    if (!image) return res.status(400).json({ error: "חסרה תמונה" });

    const prompt =
      "אתה תזונאי. נתח את תמונת הארוחה והערך את הרכבה התזונתי. " +
      (note ? "מידע נוסף מהמשתמש: " + note + ". " : "") +
      'החזר JSON בלבד במבנה: {"name":"שם קצר בעברית","items":[{"name":"שם בעברית","grams":0,"calories":0,"protein":0,"carbs":0,"fat":0}]}. הערכים למנה כפי שמופיעה בתמונה.';

    const g = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mime || "image/jpeg", data: image } }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      }
    );
    const data = await g.json();
    if (!g.ok) return res.status(502).json({ error: (data.error && data.error.message) || "שגיאה מ-Gemini" });
    const text = data.candidates[0].content.parts[0].text;
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: "שגיאה בניתוח: " + e.message });
  }
};
