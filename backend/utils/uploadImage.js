const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const uploadImage = async (base64Str, folder = 'parcels') => {
  // If not a base64 string (e.g. already a URL or empty), return as is
  if (!base64Str || !base64Str.startsWith('data:image')) {
    return base64Str;
  }
  
  try {
    const bucket = process.env.SUPABASE_BUCKET_PATH || 'carrygo-storage';
    
    // Extract base64 data and mime type
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const extension = mimeType.split('/')[1] || 'jpg';
    const fileName = `${folder}/${Date.now()}-${uuidv4()}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false
      });
      
    if (error) {
      console.error('Supabase upload error:', error.message);
      return base64Str; // Fallback to base64 if upload fails
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Image processing error:', err.message);
    return base64Str; // Fallback to base64 on error
  }
};

module.exports = uploadImage;
