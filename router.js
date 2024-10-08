import {parse as parseUrl} from 'url';
import * as Request from './utils/request.js';
import * as Text from './controllers/Text.js';
import * as Audio from './controllers/Audio.js';
import * as Image from './controllers/Image.js';
import * as Video from './controllers/Video.js';
import * as Util from './controllers/Util.js';
import * as Storage from './controllers/Storage.js';

const routes = {
    'GET': {
        '/apis/v1/authRequirements': Util.getAuthRequirements,
        '/apis/v1/image': Storage.getImage,
        '/apis/v1/audio': Storage.getAudio,
        '/apis/v1/video': Storage.getVideo,
        '/apis/v1/uploads': Storage.getUploadURL,
        '/apis/v1/downloads': Storage.getDownloadURL,
    },
    'POST': {
        '/apis/v1/text/generate': Text.getTextResponse,
        '/apis/v1/text/streaming/generate': Text.getTextStreamingResponse,
        '/apis/v1/image/generate': Image.generateImage,
        '/apis/v1/image/edit': Image.editImage,
        '/apis/v1/image/variants': Image.generateImageVariants,
        '/apis/v1/audio/generate': Audio.textToSpeech,
        '/apis/v1/audio/listVoices': Audio.listVoices,
        '/apis/v1/audio/listEmotions': Audio.listEmotions,
        '/apis/v1/video/lipsync': Video.lipsync,
        '/apis/v1/image': Storage.storeImage,
        '/apis/v1/audio': Storage.storeAudio,
        '/apis/v1/video': Storage.storeVideo,
    },
    'PUT': {
    },
    'DELETE': {
        '/apis/v1/image': Storage.deleteImage,
        '/apis/v1/audio': Storage.deleteAudio,
        '/apis/v1/video': Storage.deleteVideo,
    },
    'HEAD': {
        '/apis/v1/image': Storage.headImage,
        '/apis/v1/audio': Storage.headAudio,
        '/apis/v1/video': Storage.headVideo,
    }
};

function matchRoute(method, path) {
    const methodRoutes = routes[method];
    if (!methodRoutes) return null;

    for (const route in methodRoutes) {
        const routeRegex = route.replace(/:\w+/g, '([^/]+)');
        const regex = new RegExp(`^${routeRegex}$`);
        const match = regex.exec(path);

        if (match) {
            const paramNames = route.match(/:(\w+)/g) || [];
            const params = {};

            paramNames.forEach((paramName, index) => {
                params[paramName.substring(1)] = match[index + 1];
            });

            return { handler: methodRoutes[route], params };
        }
    }
    return null;
}


async function delegate(req, res) {
    const parsedUrl = parseUrl(req.url, true);
    const matchedRoute = matchRoute(req.method, parsedUrl.pathname);

    if (matchedRoute) {
        req.params = matchedRoute.params;
        await matchedRoute.handler(req, res);
    } else {
        Request.sendResponse(res, 404, 'application/json', {
            success: false,
            message: 'Invalid route'
        });
    }
}

export {delegate};
