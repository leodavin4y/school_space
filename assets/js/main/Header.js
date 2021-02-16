import React from "react";
import {Link} from "react-router-dom";
import {Avatar, Group, RichCell, Tooltip, PanelHeaderContent, PanelHeader} from "@vkontakte/vkui";
import {Icon28EditOutline} from '@vkontakte/icons';
import {inject, observer} from "mobx-react";
import talentLogo from '../../images/talent.png';

@inject("mainStore")
@observer
class Header extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            tooltipSeen: false
        };
    }

    talentTooltipShow = () => this.setState({ tooltipSeen: true });
    talentTooltipHide = () => this.setState({ tooltipSeen: false });
    talentTooltipFlash = () => {
        this.talentTooltipShow();
        setTimeout(this.talentTooltipHide, 4000);
    };

    render() {
        const {user, userProfile} = this.props.mainStore;
        const style = {
            display: 'block',
            position: 'relative',
            top: 0,
            left: 4,
            float: 'right',
            color: 'var(--accent)',
            cursor: 'pointer'
        };

        const school = (
            user && user.info && user.info.city && user.info.school && user.info.class && user.info.teacher ?
                <>Школа {user.info.school} {<Icon28EditOutline width={19} height={14} onClick={this.props.onClick} style={style}/>}</> :
                <span className="Link" style={{ cursor: 'pointer' }} onClick={this.props.onClick}>
                    Заполнить анкету ученика {<Icon28EditOutline width={19} height={14} style={style}/>}
                </span>
        );

        const talents = (
            <Tooltip
                mode="light"
                text="Таланты – это переплавленные умникоины, которые вы не использовали до конца месяца"
                isShown={this.state.tooltipSeen}
                onClose={this.talentTooltipHide}
            >
                <span className="Talent" onClick={() => this.talentTooltipFlash()} style={{ fontSize: 12 }}>
                    <img src={talentLogo} style={{ width: 16, height: 16, position: 'relative', top: 3, marginRight: 3 }}/>
                    {(user && user.info ? user.info.talent : 0).toFixed(2)}
                </span>
            </Tooltip>
        );

        return (
            <PanelHeader separator={false}>
                {userProfile &&
                    <PanelHeaderContent
                        disabled
                        before={<Avatar size={36} src={userProfile.photo_100 ? userProfile.photo_100 : 'https://vk.com/images/camera_50.png?ava=1'}/>}
                        status={school}
                    >
                        {userProfile.first_name} {userProfile.last_name} {talents}
                        {this.props.isAdmin &&
                            <Link to={`${prefix}/admin/login`} className="Link" style={{ padding: '0 5px', fontSize: '0.75rem' }}>
                                Admin
                            </Link>
                        }
                    </PanelHeaderContent>
                }
            </PanelHeader>
        );
    }
}

export default Header;