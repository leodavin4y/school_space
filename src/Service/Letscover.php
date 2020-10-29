<?php

namespace App\Service;

class Letscover {

    private static $endpoint = 'https://api.letscover.me/activity/';

    /**
     * @param $method
     * @param $url
     * @param null $data
     * @return bool|string
     * @throws \Exception
     */
    private static function request($method, $url, $data = null)
    {
        $url = self::$endpoint . $url;
        $curl = curl_init();

        if (!$curl) throw new \Exception('Failed to init CURL');

        if (mb_strtolower($method, 'UTF-8') === 'post') {
            curl_setopt($curl, CURLOPT_URL, $url . '?key=' . $_ENV['LETSCOVER_KEY']);
            curl_setopt($curl, CURLOPT_POST, true);

            if (!is_null($data)) curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
        } else {
            $data['key'] = $_ENV['LETSCOVER_KEY'];
            curl_setopt($curl, CURLOPT_URL, $url . '?' . http_build_query($data));
        }

        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

        $result = curl_exec($curl);
        curl_close($curl);

        return $result;
    }

    /**
     * @param int $userId
     * @param int $add
     * @return bool
     * @throws \Exception
     */
    public static function addBalance(int $userId, int $add): bool
    {
        $result = self::request('post','points/change', [
            'users' => $userId,
            'points' => $add
        ]);

        return mb_strtolower($result, 'UTF-8') === 'ok';
    }

    /**
     * @param int $userId
     * @param int $sub
     * @return bool
     * @throws \Exception
     */
    public static function subBalance(int $userId, int $sub): bool
    {
        $result = self::request('post','points/change', [
            'users' => $userId,
            'points' => 0 - $sub
        ]);

        return mb_strtolower($result, 'UTF-8') === 'ok';
    }

    /**
     * @param int|null $userId
     * @return \stdClass[]|\stdClass|null
     * @throws \Exception
     */
    public static function getActivity(?int $userId = null)
    {
        $data = null;

        if ($userId) {
            $data = ['userId' => $userId];

            return json_decode(self::request('get', 'users', $data))[0] ?? null;
        }

        return json_decode(self::request('get', 'users', $data));
    }

}