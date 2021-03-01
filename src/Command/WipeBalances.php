<?php

namespace App\Command;

use App\Repository\AdminsRepository;
use App\Repository\UsersRepository;
use App\Service\Letscover;
use App\Service\VKAPI;
use App\Service\CommandLock;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Doctrine\ORM\EntityManagerInterface;

class WipeBalances extends Command
{
    // the name of the command (the part after "bin/console")
    protected static $defaultName = 'app:wipe-balances';

    private $em;

    private $usersRep;

    private $adminsRep;

    private $commandLock;

    public function __construct(
        EntityManagerInterface $entityManager,
        UsersRepository $usersRep,
        AdminsRepository $adminsRep,
        CommandLock $commandLock,
        ?string $name = null
    ) {
        parent::__construct($name);

        $this->em = $entityManager;
        $this->usersRep = $usersRep;
        $this->adminsRep = $adminsRep;
        $this->commandLock = $commandLock;
    }

    protected function configure(){}

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        try {
            // Блокируем выполнение других команд
            $this->commandLock->lock();

            // Получаем базу letscover (чтобы при синхронизации баз пользователь не получил лишние умникоины)
            $letscoverUsers = Letscover::getActivity();

            if (count($letscoverUsers) > 0) {
                // Обнулили баллы всех пользователей в базе letscover
                foreach ($letscoverUsers as $user) {
                    if (!Letscover::subBalance($user->userId, $user->points)) throw new \Exception('Failed to sub let\'scover');
                }
            }

            $limit = 100;

            while (1) {
                // Получили пользователей (Получаем с постраничной разбивкой и всегда первую страницу)
                $users = $this->usersRep->getByLimit(1, $limit);

                if (!$users || count($users) === 0) break;

                $userIds = array_map(function ($u) {return $u->getUserId();}, $users);

                // Конвертировали умникоины в таланты
                $this->usersRep->coinsToTalents($userIds);

                // Отправили уведомления
                foreach ($users as $index => $user) {
                    $talents = round($user->getBalance() / 50, 2);

                    try {
                        VKAPI::method('messages.send', [
                            'user_id' => $user->getUserId(),
                            'random_id' => time() + $index,
                            'message' => "Умникоины переплавлены в таланты!\nТалантов получено: +{$talents}",
                            'access_token' => $_ENV['GROUP_TOKEN'],
                            'v' => 5.124
                        ]);
                    } catch (\Exception $e) {}
                }

                if (count($users) < $limit) break;
            }

            // Отправляем уведомления о завершении операции всем админам
            $admins = $this->adminsRep->findAll();

            foreach ($admins as $admin) {
                try {
                    VKAPI::sendMsg($admin->getUserId(), '[Обнуление умникоинов завершено]');
                } catch (\Exception $e) {}
            }
        } catch (\Exception $e) {
            $output->writeln($e->getMessage());

            return Command::FAILURE;
        } finally {
            // Разблокируем выполнение других команд
            $this->commandLock->unlock();
        }

        return Command::SUCCESS;
    }
}