import React from "react";
import {Link} from "react-router-dom";
import {Avatar, Group, RichCell} from "@vkontakte/vkui";
import {Icon28EditOutline} from '@vkontakte/icons';
import {inject, observer} from "mobx-react";

@inject("mainStore")
@observer
class Header extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const {user, userProfile} = this.props.mainStore;
        const style = {
            display: 'inline-block',
            position: 'relative',
            top: 3,
            color: 'var(--accent)',
            cursor: 'pointer'
        };

        const school = (
            user && user.info && user.info.city && user.info.school && user.info.class && user.info.teacher ?
                <>Школа {user.info.school} {<Icon28EditOutline width={18} height={18} onClick={this.props.onClick} style={style}/>}</> :
                <span className="Link" style={{ cursor: 'pointer' }} onClick={this.props.onClick}>
                    Заполнить анкету ученика {<Icon28EditOutline width={18} height={18} style={style}/>}
                </span>
        );

        return (
            <Group>
                {userProfile &&
                    <RichCell
                        disabled
                        before={<Avatar size={48} src={userProfile.photo_100 ? userProfile.photo_100 : 'https://vk.com/images/camera_50.png?ava=1'}/>}
                        caption={school}
                    >
                        {userProfile.first_name} {userProfile.last_name}
                        {this.props.isAdmin &&
                            <Link to={"/admin/login"} className="Link" style={{ padding: '0 5px', fontSize: '0.75rem' }}>
                                Admin
                            </Link>
                        }
                    </RichCell>
                }
            </Group>
        );
    }
}

export default Header;