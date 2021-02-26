<?php

namespace App\Service;

use App\Entity\Users;
use App\Repository\UsersRepository;

class Widget {

    protected $usersRepository;

    public function __construct(UsersRepository $usersRepository)
    {
        $this->usersRepository = $usersRepository;
    }

    protected function getUsers()
    {
        return $this->usersRepository->getTop(10);
    }

    public function build()
    {
        $users = $this->getUsers();
        $widget = [
            // Заголовок виджета, до 100 символов.
            'title' => 'Топ майнеров умникоинов',
            // URL ссылки для заголовка
            'title_url' => 'https://vk.com/app7602248_-134978221',
            // Количество плиток — от 3 до 10 для мобильных приложений, 3 для десктопной версии
            'tiles' => [],
            // Текст футера
            'more' => 'Получить умникоины',
            // URL-футера
            'more_url' => 'https://vk.com/app7602248_-134978221',
        ];
        $tiles = [];

        foreach ($users as $user) {
            /**
             * @var Users $user
             */
            $tiles[] = [
                // Заголовок элемента;
                'title' => $user->getFirstName() . ' ' . $user->getLastName(),
                // Краткое описание без переносов строки, до 50 символов
                // Выводится под заголовком элемента
                // Должен быть указан у всех элементов или не указан ни у одного из них
                'descr' => Utils::declOfNum($user->getBalance(), [
                    '%d 💎 умникоин',
                    '%d 💎 умникоина',
                    '%d 💎 умникоинов'
                ]),
                // Ссылка для всей плитки
                'url' => 'https://vk.com/id' . $user->getUserId(),
                // Текст дополнительной ссылки под элементом, до 50 символов
                // 'link' => $this->data['tiles']['link'],
                // Адрес дополнительной ссылки
                // Обязателен, если указан link
                // 'link_url' => $this->data['app_link'],
                // Идентификатор картинки для плитки 160x160 или 160x240 (размер должен быть одинаковым для всех элементов)
                'icon_id' => 'id' . $user->getUserId(),
            ];
        }

        $widget['tiles'] = $tiles;

        return 'return ' . json_encode($widget, JSON_UNESCAPED_UNICODE) . ';';
    }

    /**
     * @return bool
     */
    public function update(): bool
    {
        return VKAPI::widgetUpdate('tiles', $this->build());
    }
}