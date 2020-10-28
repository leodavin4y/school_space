<?php

namespace App\Controller;

use App\Repository\UsersRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use App\Service\VKAPI;
use Symfony\Component\HttpKernel\Exception\HttpException;
use App\Entity\Users;

class BaseApiController extends AbstractController {

    /**
     * @var \Symfony\Component\HttpFoundation\Request|null
     */
    protected $request;

    /**
     * @var mixed|null
     */
    protected $postJson;

    /**
     * @var \stdClass|null
     */
    protected $vkInit;

    /**
     * VK User ID
     * @var int|null
     */
    protected $uid;

    /**
     * @var Users $user
     */
    protected $user;

    /**
     * ApiController constructor.
     * Проверяет подпись параметров запуска приложения при каждом запросе
     * @param RequestStack $requestStack
     * @param ValidatorInterface $validator
     * @param UsersRepository $usersRep
     */
    public function __construct(RequestStack $requestStack, ValidatorInterface $validator, UsersRepository $usersRep)
    {
        $this->request = $requestStack->getCurrentRequest();

        if (strpos($this->request->headers->get('Content-Type'), 'application/json') === 0) {
            $this->postJson = json_decode($this->request->getContent(), true);
            $auth = $this->postJson['auth'] ?? null;
        } else {
            $auth = $this->request->request->get('auth', null);
        }

        $errors = $validator->validate($auth, [
            new Assert\Type(['type' => 'string']),
            new Assert\Json(),
            new Assert\NotBlank(),
        ]);
        $this->vkInit = json_decode($auth);
        $requestAllowed = count($errors) === 0 && VKAPI::verifySign($this->vkInit, $_ENV['API_SECRET']);

        if (!$requestAllowed) throw new HttpException(422, 'Validation error');

        $this->uid = $this->vkInit->vk_user_id ? intval($this->vkInit->vk_user_id) : null;
        $this->user = $usersRep->find($this->uid);

        if ($this->user && $this->user->getBan()) throw new HttpException(403, 'You have been banned');
    }

    /**
     * @param array $data
     * @param bool $status
     * @return JsonResponse
     */
    public function createResponse(array $data = [], $status = true)
    {
        return new JsonResponse([
            'status' => $status,
            'data' => $data
        ]);
    }

}