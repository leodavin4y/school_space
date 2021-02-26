<?php

namespace App\Service;

class VKAPI {

    /**
     * @var float
     */
    private static $version = 5.85;

    /**
     * @var string
     */
    private static $lang = 'ru';

    /**
     * Проверка подписи параметров запуска приложения
     * @param \stdClass $queryParams
     * @param string $clientSecret
     * @return bool
     */
    public static function verifySign(\stdClass $queryParams, string $clientSecret): bool
    {
        $signParams = [];

        foreach ($queryParams as $name => $value) {
            // Получаем только vk параметры из query
            if (strpos($name, 'vk_') !== 0) {
                continue;
            }

            $signParams[$name] = $value;
        }

        // Сортируем массив по ключам
        ksort($signParams);
        // Формируем строку вида "param_name1=value&param_name2=value"
        $signParams_query = http_build_query($signParams);
        // Получаем хеш-код от строки, используя защищеный ключ приложения. Генерация на основе метода HMAC.
        $sign = rtrim(strtr(base64_encode(hash_hmac('sha256', $signParams_query, $clientSecret, true)), '+/', '-_'), '=');
        // Сравниваем полученную подпись со значением параметра 'sign'
        return $sign === $queryParams->sign;
    }

    public static function method(string $name, array $param)
    {
        if (!isset($param['v'])) $param['v'] = self::$version;
        if (!isset($param['lang'])) $param['lang'] = self::$lang;

        $curl = curl_init();

        curl_setopt($curl, CURLOPT_URL, 'https://api.vk.com/method/' . $name);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($param));

        $result = curl_exec($curl);
        $statusCode = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

        curl_close($curl);

        if (!$statusCode) throw new \Exception('VK API return status code: ' . $statusCode);

        $result = json_decode($result);

        if (isset($result->error)) throw new \Exception($result->error->error_msg, $result->error->error_code);

        return $result;
    }

    /**
     * @param int[]|int $user
     * @param null|array $fields
     * @return \stdClass[]
     * @throws \Exception
     */
    public static function usersGet($user, $fields = null)
    {
        $profiles = self::method('users.get', [
            'user_ids' => is_array($user) ? implode(',', $user) : $user,
            'fields' => is_null($fields) ? 'photo_100' : implode(',', $fields),
            'access_token' => $_ENV['SERVICE_TOKEN']
        ]);

        if (isset($profiles->error)) throw new \Exception('VK API Error: ' . $profiles->error->error_msg, $profiles->error->error_code);

        return $profiles->response;
    }

    /**
     * @param int $userId
     * @param string $msg
     * @param array $attachments
     * @return int
     * @throws \Exception
     */
    public static function sendMsg(int $userId, string $msg, $attachments = []): int
    {
        $send = self::method('messages.send', [
            'user_id' => $userId,
            'random_id' => $_ENV['APP_ID'] + time(),
            'message' => $msg,
            'attachment' => implode(',', $attachments),
            'access_token' => $_ENV['GROUP_TOKEN'],
            'v' => 5.124
        ]);

        if (isset($send->error)) throw new \Exception($send->error->error_msg, $send->error->error_code);

        return $send->response;
    }

    public static function getMessageUploadServer($userId): string
    {
        $server = self::method('photos.getMessagesUploadServer', [
            'peer_id' => $userId,
            'access_token' => $_ENV['GROUP_TOKEN'],
            'v' => 5.124
        ]);

        if (isset($server->error)) throw new \Exception($server->error->error_msg, $server->error->error_code);

        return $server->response->upload_url;
    }

    public static function sendFile(string $url, string $filePath): \stdClass
    {
        // создание всех заголовков и отправка POST запроса с файлом
        $boundary = '---------------------' . substr(md5(rand(0, 32000)), 0, 10);

        $postData = '';
        $postData .= '--' . $boundary . "\n";
        $postData .= 'Content-Disposition: form-data; name="photo"; filename="' . uniqid() . '.jpg"' . "\n";
        $postData .= 'Content-Type: image/jpeg' . "\n";
        $postData .= 'Content-Transfer-Encoding: binary' . "\n\n";
        $postData .= file_get_contents($filePath) . "\n";
        $postData .= '--' . $boundary . "\n";

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'content' => $postData,
                'header' => [
                    'Content-Type: multipart/form-data; boundary=' . $boundary
                ]
            ]
        ]);

        $upload = json_decode(file_get_contents($url,false, $context));

        if (isset($upl->error)) throw new \Exception($upload->error->error_msg, $upload->error->error_code);

        return $upload;
    }

    public static function saveMessagesPhoto($photo, $server, $hash): \stdClass
    {
        $save = self::method('photos.saveMessagesPhoto', [
            'photo' => $photo,
            'server' => $server,
            'hash' => $hash,
            'access_token' => $_ENV['GROUP_TOKEN'],
            'v' => 5.124
        ]);

        if (isset($save->error)) throw new \Exception($save->error->error_msg, $save->error->error_code);

        return $save->response[0];
    }

    public static function attachPhotoToDialog($peerId, $filePath): string
    {
        $serverURL = self::getMessageUploadServer($peerId);
        $upload = self::sendFile($serverURL, $filePath);
        $save = self::saveMessagesPhoto($upload->photo, $upload->server, $upload->hash);

        return "photo{$save->owner_id}_{$save->id}";
    }

    public static function widgetUpdate(string $type, string $code): bool
    {
        $update = self::method('appWidgets.update', [
            'type' => $type,
            'code' => $code,
            'access_token' => $_ENV['WIDGET_TOKEN']
        ]);

        return $update->response === 1;
    }
}