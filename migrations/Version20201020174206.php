<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20201020174206 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE orders CHANGE completed completed TINYINT(1) DEFAULT \'0\' NOT NULL');
        // $this->addSql('DROP INDEX has_promo ON products');
        $this->addSql('ALTER TABLE products ADD promo_count INT DEFAULT NULL, DROP has_promo');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE orders CHANGE completed completed TINYINT(1) NOT NULL');
        // $this->addSql('ALTER TABLE products ADD has_promo TINYINT(1) NOT NULL, DROP promo_count');
        $this->addSql('CREATE INDEX has_promo ON products (has_promo)');
    }
}
