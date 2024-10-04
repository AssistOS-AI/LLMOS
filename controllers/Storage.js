import * as Storage from '../handlers/S3.js';
import * as Request from '../utils/request.js'

const fileTypes = Object.freeze({
    audios: {
        contentType: "audio/mp3",
        extension: "mp3"
    },
    images: {
        contentType: "image/png",
        extension: "png"
    },
    videos: {
        contentType: "video/mp4",
        extension: "mp4"
    }
});

async function getDownloadURL(req, res) {
    try {
        const {spaceId, downloadType, fileId} = Request.extractQueryParams(req);
        if (!spaceId || !downloadType || !fileId) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Missing required parameters" + `:${spaceId ? "" : " spaceId"}${downloadType ? "" : " downloadType"}${fileId ? "" : " fileId"}`,
                success: false
            });
        }
        if (!Object.keys(fileTypes).includes(downloadType)) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Invalid upload type",
                success: false
            });
        }
        const objectPath = `${spaceId}/${downloadType}/${fileId}` + `.${fileTypes[downloadType].extension}`;
        const downloadURL = await Storage.getDownloadURL(Storage.devBucket, objectPath);
        Request.sendResponse(res, 200, "application/json", {
            message: "Download URL generated successfully",
            success: true,
            data: downloadURL
        });
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get download URL:" + error.message,
            success: false
        });
    }
}

async function getUploadURL(req, res) {
    try {
        const {spaceId, uploadType, fileId} = Request.extractQueryParams(req);
        if (!spaceId || !uploadType || !fileId) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Missing required parameters" + `:${spaceId ? "" : " spaceId"}${uploadType ? "" : " uploadType"}${fileId ? "" : " fileId"}`,
                success: false
            });
        }
        if (!Object.keys(fileTypes).includes(uploadType)) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Invalid upload type",
                success: false
            });
        }
        const objectPath = `${spaceId}/${uploadType}/${fileId}` + `.${fileTypes[uploadType].extension}`;
        const uploadURL = await Storage.getUploadURL(Storage.devBucket, objectPath, fileTypes[uploadType].contentType);
        Request.sendResponse(res, 200, "application/json", {
            message: "Upload URL generated successfully",
            success: true,
            data: uploadURL
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get upload URL" + error.message,
            success: false
        });
    }
}

async function getS3File(req, res, fileExtension) {
    let { fileName } = Request.extractQueryParams(req);
    if (!fileName) {
        return Request.sendResponse(res, 400, "application/json", {
            message: "Missing required parameters" + `:${fileName ? "" : " fileName"}`,
            success: false
        });
    }
    fileName += `.${fileExtension}`;

    const rangeHeader = req.headers.range;
    const headers = rangeHeader ? { Range: rangeHeader } : {};

    const S3Response = await Storage.getObject(Storage.devBucket, fileName, headers);

    const fileSize = S3Response.ContentLength;

    if (rangeHeader) {
        const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        const head = {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': chunkSize,
            'Content-Type': S3Response.ContentType,
        };

        res.writeHead(206, head);
        S3Response.Body.pipe(res);
    } else {
        const head = {
            'Accept-Ranges': 'bytes',
            'Content-Length': fileSize,
            'Content-Type': S3Response.ContentType,
        };

        res.writeHead(200, head);
        S3Response.Body.pipe(res);
    }
}


async function getImage(req, res) {
    try {
        return await getS3File(req, res, "png");
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to retrieve image:" + error.message,
            success: false
        });
    }
}

async function getAudio(req, res) {
    try {
        return await getS3File(req, res, "mp3");
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to retrieve Audio:" + error.message,
            success: false
        });
    }
}

async function getVideo(req, res) {
    try {
        return await getS3File(req, res, "mp4");
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to retrieve Video:" + error.message,
            success: false
        });
    }
}

async function storeImage(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".png";
        const data = req.body;
        await Storage.uploadObject(Storage.devBucket, fileName, data, req.headers["content-type"]);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Image stored successfully",
            success: true
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to store image",
            success: false
        })
    }
}

async function storeAudio(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".mp3";
        const data = req.body;
        await Storage.uploadObject(Storage.devBucket, fileName, data, req.headers["content-type"]);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Audio stored successfully",
            success: true
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to store Audio",
            success: false
        })
    }
}

async function storeVideo(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".mp4";
        const data = req.body;
        await Storage.uploadObject(Storage.devBucket, fileName, data, req.headers["content-type"]);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Video stored successfully",
            success: true
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to store Video",
            success: false
        })
    }
}

async function deleteImage(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        await Storage.deleteObject(Storage.devBucket, fileName);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Image stored successfully",
            success: true
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete Image",
            success: false
        })
    }
}

async function deleteAudio(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        await Storage.deleteObject(Storage.devBucket, fileName);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Audio stored successfully",
            success: true
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete Audio",
            success: false
        })
    }
}

async function deleteVideo(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        await Storage.deleteObject(Storage.devBucket, fileName);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Video stored successfully",
            success: true
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete Video",
            success: false
        })
    }
}

async function headImage(req, res) {
}

async function headAudio(req, res) {
}

async function headVideo(req, res) {
}

export {
    getUploadURL,
    getDownloadURL,
    getImage,
    getAudio,
    getVideo,
    storeImage,
    storeAudio,
    storeVideo,
    deleteImage,
    deleteAudio,
    deleteVideo,
    headImage,
    headAudio,
    headVideo
}
