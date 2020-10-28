<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20201020085944 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE orders ADD promo_code_id INT DEFAULT NULL, DROP promo_code');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEE2FAE4625 FOREIGN KEY (promo_code_id) REFERENCES promo_codes (id)');
        $this->addSql('CREATE INDEX IDX_E52FFDEE2FAE4625 ON orders (promo_code_id)');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEE2FAE4625');
        $this->addSql('DROP INDEX IDX_E52FFDEE2FAE4625 ON orders');
        $this->addSql('ALTER TABLE orders ADD promo_code VARCHAR(255) CHARACTER SET utf8mb4 DEFAULT NULL COLLATE `utf8mb4_unicode_ci`, DROP promo_code_id');
    }
}
