const cloudinary = require('cloudinary').v2;

exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { publicId } = JSON.parse(event.body);
    console.log('Received public_id:', publicId); // Debug log

    if (!publicId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing public_id' }),
      };
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
      api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET
    });

    // Log configuration (without sensitive data)
    console.log('Cloudinary Config:', {
      cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
      publicId
    });

    // Use the destroy method with proper error handling
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: "raw",
      invalidate: true
    });

    console.log("Cloudinary Response:", result);

    if (result.result === 'ok') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'File deleted successfully',
          data: result 
        }),
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to delete file', 
          details: result 
        }),
      };
    }
  } catch (error) {
    console.error('Error details:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Server error', 
        message: error.message 
      }),
    };
  }
};