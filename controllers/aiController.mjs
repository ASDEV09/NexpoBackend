import axios from 'axios';

const genAI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// --- HELPER: GEMINI WRAPPER WITH RETRY ---
const callGeminiAPI = async (payload, retries = 3) => {
    const url = `${genAI_API_URL}?key=${process.env.GEMINI_API_KEY}`;
    try {
        return await axios.post(url, payload);
    } catch (error) {
        if (error.response && error.response.status === 429 && retries > 0) {
            // Backoff: 2s -> 4s -> 6s
            const waitTime = (4 - retries) * 2000;
            console.warn(`[Gemini API] Rate Limit 429. Retrying in ${waitTime}ms... (${retries} attempts left)`);
            await new Promise(res => setTimeout(res, waitTime));
            return callGeminiAPI(payload, retries - 1);
        }
        throw error;
    }
};

// --- HELPER: JSON Extractor ---
// Robustly finds and parses JSON from potentially chatty AI responses
const extractJSON = (text) => {
    if (!text) return null;
    try {
        // 1. Try direct parse
        return JSON.parse(text);
    } catch (e) {
        // 2. Try to find markdown code block
        const markdownMatch = text.match(/```json([\s\S]*?)```/);
        if (markdownMatch && markdownMatch[1]) {
            try {
                return JSON.parse(markdownMatch[1].trim());
            } catch (e2) { /* continue */ }
        }

        // 3. Try to find the first '{' or '[' and the last '}' or ']'
        const firstOpen = text.search(/[{[]/);
        const lastClose = text.search(/[}\]]$/); // search from end is tricky with regex, let's do simple substring

        if (firstOpen !== -1) {
            // Find the last closing brace/bracket matching the type
            const isArray = text[firstOpen] === '[';
            const lastIndex = text.lastIndexOf(isArray ? ']' : '}');
            if (lastIndex !== -1 && lastIndex > firstOpen) {
                const jsonCandidate = text.substring(firstOpen, lastIndex + 1);
                try {
                    return JSON.parse(jsonCandidate);
                } catch (e3) { /* continue */ }
            }
        }
        return null;
    }
};

// Smart Keywords Dictionary for "Mock AI" (When no API Key is present)
const SMART_CONTEXT = {
    "tech": ["cutting-edge algorithms", "digital transformation", "scalable architecture", "future-proof ecosystems", "next-gen innovation"],
    "business": ["market leadership", "ROI maximization", "disruptive strategies", "global expansion", "sustainable growth"],
    "health": ["clinical breakthroughs", "patient-centric care", "biotech advancements", "holistic wellness", "telemedicine frontiers"],
    "design": ["user-centric experiences", "aesthetic minimalism", "cognitive accessibility", "visual storytelling", "brand resonance"],
    "general": ["industry best practices", "networking opportunities", "actionable insights", "expert-led panels", "strategic milestones"]
};

// "Mad Libs" on steroids - Generates varied sentence structures
const generateSmartFallback = (title, type, topic) => {
    const safeTopic = (topic || "general").toLowerCase();

    // Find matching category or default to general
    let category = "general";
    for (const key of Object.keys(SMART_CONTEXT)) {
        if (safeTopic.includes(key)) category = key;
    }

    const buzzwords = SMART_CONTEXT[category];
    const randomBuzz = () => buzzwords[Math.floor(Math.random() * buzzwords.length)];

    const templates = [
        `Unlock the full potential of ${title}. This exclusive ${type} dives deep into ${randomBuzz()} and ${randomBuzz()}, offering participants a competitive edge in today's landscape.`,
        `Are you ready to redefine ${safeTopic}? '${title}' is curated for visionaries seeking to master ${randomBuzz()}. Join industry leaders as we explore the intersection of ${randomBuzz()} and practical application.`,
        `Experience a masterclass in ${safeTopic}. '${title}' brings you face-to-face with the latest trends in ${randomBuzz()}. Don't miss this opportunity to elevate your understanding of ${randomBuzz()} and drive real impact.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
};

export const generateDescription = async (req, res) => {
    const { title, topic, type } = req.body;

    if (!title) {
        return res.status(400).json({ message: "Title is required for AI generation." });
    }

    // 1. Check for API Key (Real AI)
    console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing"); // DEBUG

    if (process.env.GEMINI_API_KEY) {
        try {
            const promptContext = `
            Act as a world-class Event Content Strategist.
            Write a high-energy, sophisticated, and shorter description for an event.
            
            Context:
            - Event Title: "${title}"
            - Topic/Theme: "${topic}"
            - Type: "${type}"

            Directives:
            1. Do NOT start with "Join us". Be creative.
            2. Infer potential agenda points based on the title (e.g. if title is 'AI', mention 'Neural Networks').
            3. Use strong verbs (e.g. "Discover", "Master", "Revolutionize").
            4. Keep it under 250 characters.
            5. Return PLAIN TEXT only.
            `;

            const response = await callGeminiAPI(
                {
                    contents: [{ parts: [{ text: promptContext }] }]
                }
            );

            const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
                return res.status(200).json({ description: generatedText.trim() });
            }
        } catch (error) {
            console.error("Gemini API Detailed Error:", error.response?.data || error.message);
        }
    } else {
        console.log("No GEMINI_API_KEY found in process.env. Using Smart Mock AI.");
    }

    // 2. Fallback: Smart Mock AI (Local Logic)
    // ONLY use this if we didn't return above.
    console.log("Falling back to Smart Mock AI because Real AI failed or key missing.");
    const smartDescription = generateSmartFallback(title, type, topic);

    return res.status(200).json({
        description: smartDescription,
        note: "Demo Mode - Add GEMINI_API_KEY to enable Real AI"
    });
};

// --- HELPER: Sanitize Interest Arrays ---
// Prevents nested JSON strings and recursion from inflating payloads
const sanitizeInterests = (interests) => {
    if (!interests) return [];

    // If it's a string that looks like JSON, try to parse it
    if (typeof interests === 'string') {
        if (interests.startsWith('[') && interests.endsWith(']')) {
            try {
                const parsed = JSON.parse(interests);
                return sanitizeInterests(parsed); // Recurse
            } catch (e) {
                return [interests.substring(0, 50)]; // Return simple truncated string
            }
        }
        return interests.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (Array.isArray(interests)) {
        // Flatten and clean
        const flat = interests.flatMap(i => sanitizeInterests(i));
        // Deduplicate and limit length
        return [...new Set(flat)].slice(0, 10);
    }

    return [];
};

export const getRecommendations = async (req, res) => {
    // userProfile: { interests: [], jobTitle: "" }
    // candidates: [{ width: "...", id: "...", title: "...", description: "..." }]
    const { userProfile, candidates } = req.body;

    if (!candidates || candidates.length === 0) {
        return res.json({ recommendations: [] });
    }

    // 1. Check for API Key (Real AI)
    if (process.env.GEMINI_API_KEY) {
        try {
            // Sanitize candidates to prevent payload explosion
            const cleanCandidates = candidates.map(c => ({
                id: c._id || c.id,
                title: (c.title || c.name || "Event").substring(0, 50),
                desc: (c.description || c.topic || "").substring(0, 100),
                interests: sanitizeInterests(c.interests)
            }));

            const promptContext = `
            Act as an elite Event Concierge.
            
            User Profile:
            - Name: ${userProfile.name}
            - Role: ${userProfile.role}
            - KEY INTERESTS: ${JSON.stringify(sanitizeInterests(userProfile.interests))}
            
            Candidates (Expos/Sessions): 
            ${JSON.stringify(cleanCandidates)}
            
            Matchmaking Rules:
            1. STRICTLY prioritization: Match candidates that align closely with the user's KEY INTERESTS.
            2. If a direct match exists, rank it first.
            3. If no direct match, find the most logical cross-disciplinary connection (e.g., "Technology" -> "Digital Art").
            4. Select exactly 3 recommendations.
            
            Output Format:
            Return a JSON array ONLY:
            [
                { 
                    "id": "candidate_id", 
                    "reason": "Write a personalized 1-sentence hook referencing their specfic interest. E.g. 'Since you love [Interest], you must see this...'" 
                }
            ]
            `;

            const response = await callGeminiAPI(
                {
                    contents: [{ parts: [{ text: promptContext }] }]
                }
            );

            let generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
                const recommendations = extractJSON(generatedText);
                if (recommendations) {
                    return res.status(200).json({ recommendations });
                }
            }
        } catch (error) {
            console.error("Gemini Recommendations Error:", error);
            // Fall through to fallback
        }
    }

    // 2. Fallback Logic (Smart Keyword Matcher)
    // If AI fails/missing, we manually match interests to candidates
    const fallbackRecs = candidates.map(c => {
        const text = `${c.title} ${c.desc} ${c.topic} ${(c.interests || []).join(' ')}`.toLowerCase();
        let matchScore = 0;
        let matchedInterest = "";

        if (userProfile.interests && userProfile.interests.length > 0) {
            userProfile.interests.forEach(interest => {
                if (text.includes(interest.toLowerCase())) {
                    matchScore += 1;
                    matchedInterest = interest;
                }
            });
        }

        return { ...c, matchScore, matchedInterest };
    })
        .sort((a, b) => b.matchScore - a.matchScore) // Sort by best match
        .slice(0, 3) // Top 3
        .map(c => ({
            id: c._id || c.id,
            reason: c.matchedInterest
                ? `Matches your interest in ${c.matchedInterest}.`
                : "Popular event tailored for you."
        }));

    return res.status(200).json({
        recommendations: fallbackRecs
    });
};

// ------------------------------------------------------------------
// 3. AI MATCH SCORE (Specific Item vs User)
// ------------------------------------------------------------------
export const calculateMatchScore = async (req, res) => {
    const { userProfile, item } = req.body; // item = { title, description, topics }

    // Fallback if no interests
    if (!userProfile?.interests || userProfile.interests.length === 0) {
        return res.json({ score: 75, reason: "Update your profile interests for a precise score!" });
    }

    try {
        if (process.env.GEMINI_API_KEY) {
            const prompt = `
            Act as a compatibility algorithm.
            
            User Interests: ${JSON.stringify(userProfile.interests)}
            Event Details: Title: "${item.title}", Desc: "${item.description ? item.description.substring(0, 300) : ''}", Tags: "${item.topics || ''}"

            Task:
            1. Calculate a compatibility score (0-100) based on semantic relevance.
            2. Write a short, punchy 1-sentence reason addressing the user directly (e.g. "Perfect for your interest in AI").
            
            Output JSON ONLY:
            { "score": number, "reason": "string" }
            `;

            const response = await callGeminiAPI(
                {
                    contents: [{ parts: [{ text: prompt }] }]
                }
            );

            let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const data = extractJSON(text);
                if (data) return res.json(data);
            }
        }

    } catch (e) {
        console.error("AI Match Error:", e.message);
    }

    // FALLBACK (Smart Keyword Logic)
    const text = `${item.title} ${item.description || ''} ${item.topics || ''}`.toLowerCase();
    let hits = 0;
    let hitWord = "";

    userProfile.interests.forEach(int => {
        const keyword = int.toLowerCase().trim();
        if (keyword && text.includes(keyword)) {
            hits++;
            hitWord = int;
        }
    });

    // Base score 40 (Average) + 20 points per hit
    let score = 40 + (hits * 20);

    // Cap at 95, Floor at 40
    if (score > 95) score = 95;
    if (score < 40) score = 40;

    // Add a bit of "randomness" to make it feel more organic if it's just a base match
    if (hits === 0) {
        score += Math.floor(Math.random() * 10); // 40-49 range for non-matches
    }

    return res.json({
        score,
        reason: hits > 0
            ? `High relevance to your interest in ${hitWord}.`
            : "General recommendation based on popularity."
    });
};

// ------------------------------------------------------------------
// 4. AI DAY PLANNER (Itinerary Builder)
// ------------------------------------------------------------------
export const planVisit = async (req, res) => {
    const { userProfile, schedule } = req.body;

    // schedule = [{id, title, startTime, endTime, description}]

    // Fallback if no schedule
    if (!schedule || schedule.length === 0) {
        return res.json({ itinerary: [] });
    }

    try {
        if (process.env.GEMINI_API_KEY) {
            const prompt = `
            Act as an Event Planner.
            
            User Interests: ${JSON.stringify(userProfile.interests)}
            Event Schedule: ${JSON.stringify(schedule.map(s => ({ id: s._id, title: s.eventName, time: s.startTime + '-' + s.endTime, desc: s.description })))}

            Task:
            1. Select up to 4 sessions that BEST match the user's interests.
            2. Ensure times do not overlap (if possible).
            3. Prioritize diversity of topics.
            
            Output JSON array of IDs ONLY:
            ["event_id_1", "event_id_2"]
            `;

            const response = await callGeminiAPI(
                {
                    contents: [{ parts: [{ text: prompt }] }]
                }
            );

            let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const plannedIds = extractJSON(text);

                if (plannedIds && Array.isArray(plannedIds)) {
                    // Filter full objects
                    const itinerary = schedule.filter(s => plannedIds.includes(s._id));
                    return res.json({ itinerary });
                }
            }
        }
    } catch (e) {
        console.error("AI Plan Error:", e.message);
    }

    // Fallback: Pick top 3 matches manually
    const itinerary = schedule.filter(s => {
        const text = (s.eventName + s.description).toLowerCase();
        return userProfile.interests.some(int => text.includes(int.toLowerCase()));
    }).slice(0, 3);

    return res.json({ itinerary });
};

// ------------------------------------------------------------------
// 5. AI BOOTH AUDIT (Exhibitor Coach)
// ------------------------------------------------------------------
export const auditBooth = async (req, res) => {
    const { booth } = req.body;

    if (!booth) return res.status(400).json({ message: "No booth data" });

    // Mock response if no key
    if (!process.env.GEMINI_API_KEY) {
        return res.json({
            score: 78,
            tips: [
                "Add more high-quality images to showcase your booth.",
                "Your description is brief; detail your key products.",
                "Highlight specific offers to attract more registrations."
            ]
        });
    }

    try {
        const prompt = `
        Act as a Trade Show Expert. Audit this booth setup.
        
        Data:
        - Name: ${booth.name}
        - Size: ${booth.size}
        - Description: ${booth.description || "N/A"}
        - Expo: ${booth.expoId?.title || "General"}
        
        Task:
        1. Rate the booth attractiveness (0-100).
        2. Provide 3 specific, actionable tips to increase visitor engagement.
        
        CRITICAL: Output valid JSON ONLY. Do not write any introduction or conclusion text.
        
        Output JSON Format:
        { "score": number, "tips": ["string", "string", "string"] }
        `;

        const response = await callGeminiAPI(
            { contents: [{ parts: [{ text: prompt }] }] }
        );

        let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            const result = extractJSON(text);
            if (result) return res.json(result);
            console.error("AI Audit Parse Failed. Raw text:", text);
        }

    } catch (e) {
        if (e.response && e.response.status === 429) {
            console.warn("AI Audit: Rate limit exceeded even after retries. Serving fallback.");
        } else {
            console.error("AI Audit Error:", e.message);
        }
    }

    // Fallback on error
    return res.json({
        score: 70,
        tips: [
            "Ensure your booth name and signage are visible from a distance.",
            "Consider adding an interactive demo to engage visitors.",
            "Update your booth description to clearly state your value proposition."
        ]
    });
};
