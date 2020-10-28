<?php

namespace App\Service;

class Letscover {

    private static function request($method, $url, $data = null)
    {
        $curl = curl_init();

        if (!$curl) throw new \Exception('Failed to init CURL');

        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

        if (mb_strtolower($method, 'UTF-8') === 'post') curl_setopt($curl, CURLOPT_POST, true);
        if (!is_null($data)) curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));

        $result = curl_exec($curl);
        curl_close($curl);

        return $result;
    }

    public static function addBalance(int $userId, int $add): bool
    {
        $result = self::request('post','https://api.letscover.me/activity/points/change?key=' . $_ENV['LETSCOVER_KEY'], [
            'users' => $userId,
            'points' => $add
        ]);

        return mb_strtolower($result, 'UTF-8') === 'ok';
    }

    public static function subBalance(int $userId, int $sub): bool
    {
        $result = self::request('post','https://api.letscover.me/activity/points/change?key=' . $_ENV['LETSCOVER_KEY'], [
            'users' => $userId,
            'points' => 0 - $sub
        ]);

        return mb_strtolower($result, 'UTF-8') === 'ok';
    }

    public static function getActivity(?int $userId = null)
    {
        $data = null;

        if ($userId) $data = ['userId' => $userId];

        return json_decode(
            self::request(
                'get',
                'https://api.letscover.me/activity/users?key=' . $_ENV['LETSCOVER_KEY'],
                $data
            )
        );
    }

}