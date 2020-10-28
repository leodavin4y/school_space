import React from "react";
import {Icon56ErrorOutline} from "@vkontakte/icons";
import {Button, Div, Text, Title} from "@vkontakte/vkui";
import {PageDialog} from "@happysanta/vk-app-ui";
import {monthRus} from "../utils";
import classNames from "classnames";

class PopupCanceled extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const {date_at, cancel_comment} = this.props;

        return (
            <PageDialog
                onClose={this.props.onClose}
                className={classNames({
                    "PageDialog": true,
                    "PageDialog__window--fixed-width": true,
                    "PageDialog__window--mobile": this.props.mobile
                })}
            >
                <div style={{ width: 44, margin: '0 auto 15px auto' }}>
                    <Icon56ErrorOutline width={44} height={44} style={{ color: 'var(--accent)' }}/>
                </div>

                <Title level="2" weight="semibold" style={{ marginBottom: 5, textTransform: 'uppercase' }}>
                    Отказ в конвертации
                </Title>

                <Title level="3" weight="semibold" style={{ marginBottom: 16, textTransform: 'uppercase' }}>
                    {date_at.format('D')} {monthRus(date_at.month())} {date_at.format('YYYY')}
                </Title>

                {cancel_comment &&
                    <Text weight="regular" style={{ marginBottom: 16 }}>
                        {cancel_comment}
                    </Text>
                }

                <Div>
                    <Button
                        size="l"
                        mode="destructive"
                        style={{ cursor: 'pointer' }}
                        onClick={this.props.onButtonClick}
                    >
                        Исправить
                    </Button>
                </Div>
            </PageDialog>
        );
    }
}

export default PopupCanceled;