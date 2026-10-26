const CONFIDENCE_THRESHOLD = 0.85;
const PERSON_LABEL = 'person';
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50';

// turn HF status codes into messages the user can act on
const getHfErrorMessage = (status, hfMessage) => {
    switch (status) {
        case 402:
            return 'detection service is out of credits, please try again later';
        case 401:
        case 403:
            return 'detection service rejected the API token';
        case 429:
            return 'too many detection requests, please wait a moment';
        case 503:
            return 'detection model is loading, please try again in a few seconds';
        default:
            return hfMessage || 'error detecting objects from image';
    }
};

// moved from frontend so we can:
// 1. keep HF token safe (only in backend env, not exposed in bundle)
// 2. avoid CORS issues (backend can fetch any image without browser restrictions)
// 3. keep all detection logic in one place (cleaner architecture)
const handleDetect = async (req, res, db) => {
    const { image_url } = req.body;

    if (!image_url) {
        return res.status(400).json('image URL is required');
    }

    try {
        // fetch the image from whatever URL they provided
        // this works on backend without CORS issues
        const imgResponse = await fetch(image_url);
        if (!imgResponse.ok) {
            return res.status(400).json('unable to fetch image from URL');
        }

        const imgBlob = await imgResponse.blob();

        // hit up Hugging Face API with our secret token (stays on server, never exposed)
        const hfResponse = await fetch(HF_API_URL, {
            headers: {
                Authorization: `Bearer ${process.env.VITE_HF_TOKEN}`,
            },
            method: 'POST',
            body: imgBlob,
        });

        if (!hfResponse.ok) {
            // HF sends the reason as { error: '...' } in the body, log it so it shows in server logs
            const hfError = await hfResponse.json().catch(() => ({}));
            console.log(`HF error ${hfResponse.status}:`, hfError.error || hfError);
            return res.status(502).json(getHfErrorMessage(hfResponse.status, hfError.error));
        }

        const results = await hfResponse.json();

        // only return high confidence detections
        let highConfidenceItems = results.filter(item => item.score >= CONFIDENCE_THRESHOLD);

        // only return persons, not other objects
        const detectedPersons = highConfidenceItems.filter(item => item.label === PERSON_LABEL);

        res.json(detectedPersons);

    } catch (error) {
        console.log(error);
        res.status(400).json('error processing image');
    }
};

module.exports = {
    handleDetect: handleDetect
};
