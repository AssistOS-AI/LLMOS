import {parse as parseUrl} from 'url';
import * as Request from './utils/request.js';
import * as Text from './controllers/Text.js';
import * as Audio from './controllers/Audio.js';
import * as Image from './controllers/Image.js';
import * as Video from './controllers/Video.js';
import * as Util from './controllers/Util.js';

const routes = {
    'GET': {
        '/apis/v1/authRequirements': Util.getAuthRequirements,
    },
    'POST': {
        '/apis/v1/text/generate': Text.getTextResponse,
        '/apis/v1/text/streaming/generate': Text.getTextStreamingResponse,
        '/apis/v1/image/generate': Image.generateImage,
        '/apis/v1/image/edit': Image.editImage,
        '/apis/v1/image/variants': Image.generateImageVariants,
        '/apis/v1/video/generate': Video.generateVideo,
        '/apis/v1/audio/generate': Audio.textToSpeech,
        '/apis/v1/audio/listVoices': Audio.listVoices,
        '/apis/v1/audio/listEmotions': Audio.listEmotions
    },
    'PUT': {},
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
