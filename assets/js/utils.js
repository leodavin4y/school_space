import bridge from "@vkontakte/vk-bridge";

export function declOfNum(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];

    return titles[
        (number % 100 > 4 && number % 100 < 20) ?
            2 :
            cases[(number % 10 < 5) ? number % 10 : 5]
    ];
}

export function monthRus(num, decl = 1) {
    return (decl === 1 ? [
        'Января',
        'Февраля',
        'Марта',
        'Апреля',
        'Мая',
        'Июня',
        'Июля',
        'Августа',
        'Сентября',
        'Октября',
        'Ноября',
        'Декабря',
    ] : [
        'Январе',
        'Феврале',
        'Марте',
        'Апреле',
        'Мае',
        'Июне',
        'Июле',
        'Августе',
        'Сентябре',
        'Октябре',
        'Ноябре',
        'Декабре',
    ])[num];
}

export function Api(method, params, reqId = null) {
    return bridge.send('VKWebAppCallAPIMethod', {
        method: method,
        request_id: reqId ? reqId : randomStr(),
        params: params
    });
}

export async function getAccessToken(scope = '') {
    const token = await bridge.send("VKWebAppGetAuthToken", {
        "app_id": APP_ID,
        "scope": scope
    });

    return token.access_token
}

export async function getCurrentUser(accessToken, requestId = null) {
    const user = await bridge.send("VKWebAppCallAPIMethod", {
        "method": "users.get",
        "request_id": requestId ? requestId : randomStr(),
        "params": {"fields": "city,schools", "v": "5.124", "access_token": accessToken}
    });

    return user.response[0];
}

export function randomStr() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random()
            .toString(36)
            .substring(2, 15);
}

export function emit(name, data = {}, targetEl = window)
{
    targetEl.dispatchEvent(new CustomEvent(name, {
        'detail': data
    }));
}