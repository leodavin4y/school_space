<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20201029180143 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE history DROP INDEX UNIQ_27BA704BDF69572F, ADD INDEX IDX_27BA704BDF69572F (points_id)');
        $this->addSql('ALTER TABLE history DROP INDEX UNIQ_27BA704BA76ED395, ADD INDEX IDX_27BA704BA76ED395 (user_id)');
        $this->addSql('ALTER TABLE history DROP INDEX UNIQ_27BA704BCFFE9AD6, ADD INDEX IDX_27BA704BCFFE9AD6 (orders_id)');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE history DROP INDEX IDX_27BA704BDF69572F, ADD UNIQUE INDEX UNIQ_27BA704BDF69572F (points_id)');
        $this->addSql('ALTER TABLE history DROP INDEX IDX_27BA704BCFFE9AD6, ADD UNIQUE INDEX UNIQ_27BA704BCFFE9AD6 (orders_id)');
        $this->addSql('ALTER TABLE history DROP INDEX IDX_27BA704BA76ED395, ADD UNIQUE INDEX UNIQ_27BA704BA76ED395 (user_id)');
    }
}
