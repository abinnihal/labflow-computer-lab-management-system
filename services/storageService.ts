const CLOUD_NAME = 'ddihd0l4n';
const UPLOAD_PRESET = 'labflow_upload';

interface UploadResult {
    url: string;
    publicId: string;
    format: string;
}

export const uploadSelfie = async (base64Data: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'labflow/attendance_proofs');

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Selfie upload error:", error);
        throw error;
    }
};

export const uploadAssignment = async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'labflow/assignments');

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'File upload failed');
        }

        const data = await response.json();

        // --- FIX FOR PDF 401 & BROWSER CRASH ---
        // Cloudinary blocks inline viewing of PDFs on free tiers. 
        // We inject `fl_attachment` into the URL to force the browser to download it safely.
        let finalUrl = data.secure_url;
        if (data.format === 'pdf' || file.type === 'application/pdf') {
            finalUrl = finalUrl.replace('/upload/', '/upload/fl_attachment/');
        }

        return {
            url: finalUrl,
            publicId: data.public_id,
            format: data.format || file.name.split('.').pop() || 'unknown'
        };
    } catch (error) {
        console.error("Assignment upload error:", error);
        throw error;
    }
};