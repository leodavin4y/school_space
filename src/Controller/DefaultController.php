<?php

namespace App\Controller;

use App\Kernel;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Точка входа в SPA front-end
 * Class DefaultController
 * @package App\Controller
 */
class DefaultController extends AbstractController
{
    /**
     * @Route("/{reactRouting}", name="index", requirements={"reactRouting"="(?!api).+"}, defaults={"reactRouting": null})
     */
    public function index()
    {
        return $this->render('default/index.html.twig');
    }

    /**
     * @Route("/api/log", name="api_log")
     *
     * @param Request $request
     * @param ValidatorInterface $validator
     * @param Kernel $kernel
     * @return Response
     */
    public function log(Request $request, ValidatorInterface $validator, Kernel $kernel)
    {
        if ($_ENV['APP_ENV'] === 'dev') return new Response('NO');

        $params = $request->request->all();
        $constraints = new Assert\Collection([
            'fields' => [
                'log' => new Assert\Optional([
                    new Assert\NotBlank(),
                    new Assert\Type('string'),
                ])
            ],
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        file_put_contents($kernel->getLogDir() . '/js.log', $params['log'] . "\n\n", FILE_APPEND);

        return new Response('OK');
    }
}