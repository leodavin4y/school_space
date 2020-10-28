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

        curl_close($curl);

        return json_decode($result);
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
}