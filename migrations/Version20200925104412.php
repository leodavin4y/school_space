<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20200925104412 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE `points_photos` (`id` int(11) NOT NULL,`point_id` int(11) NOT NULL,`name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        $this->addSql('ALTER TABLE `points_photos` ADD PRIMARY KEY (`id`), ADD KEY `IDX_E848898FC028CEA2` (`point_id`)');
        $this->addSql('ALTER TABLE `points_photos` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15');
        $this->addSql('ALTER TABLE `points_photos` ADD CONSTRAINT `FK_E848898FDC711EC4` FOREIGN KEY (`point_id`) REFERENCES `points` (`id`)');
        $this->addSql('ALTER TABLE points ADD cancel TINYINT(1) DEFAULT \'0\' NOT NULL');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE points_photos');
        $this->addSql('ALTER TABLE points DROP cancel');
    }
}
