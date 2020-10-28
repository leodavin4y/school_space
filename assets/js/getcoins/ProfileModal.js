import React from "react";
import {
    ANDROID,
    Div,
    FormLayout,
    Input,
    IOS,
    ModalPage,
    ModalPageHeader,
    ModalRoot,
    PanelHeaderButton,
    Select,
    Headline,
    withPlatform
} from "@vkontakte/vkui";
import {Icon24Cancel, Icon24Dismiss} from "@vkontakte/icons";
import axios from "axios";
import PropTypes from 'prop-types';
import bridge from "@vkontakte/vk-bridge";
import {getAccessToken, getCurrentUser} from "../utils";
import {inject, observer} from "mobx-react";

@inject("mainStore")
@observer
class ProfileModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeModal: null,
            city: '',
            school: '',
            class: 1,
            teacher: '',
            validateForm: false,
            formIsValid: false,
        };

        this.userFetched = false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.show && !this.userFetched) this.autocompleteFromProfile();
    }

    autocompleteFromProfile = async () => {
        this.userFetched = true;
        const user = await this.fetchProfile();

        if (user === null || (!user.city || !user.school || !user.class || !user.teacher)) {
            let city = this.state.city;
            let school = this.state.school;
            let classNum = this.state.class;

            try {
                const token = await getAccessToken();
                const profile = await getCurrentUser(token);
                const calcClass = (yearFrom) => {
                    const date1 = new Date("01/09/" + yearFrom);
                    const date2 = new Date();
                    const DiffInDays = (date2.getTime() - date1.getTime()) / (1000 * 3600 * 24);

                    console.log('Diff:', DiffInDays);

                    return Math.ceil(DiffInDays / 365);
                };

                city = profile.city.title ?? city;

                if ('schools' in profile && 'name' in profile.schools[profile.schools.length - 1]) {
                    const schoolInfo = profile.schools[profile.schools.length - 1];

                    school = schoolInfo.name ?? school;
                    classNum = 'year_from' in schoolInfo ? calcClass(schoolInfo.year_from) : 1;
                }
            } catch(e) {
                bridge.send("VKWebAppGetUserInfo")
                    .then(data => {
                        city = data.city.title ?? city;
                    });
            }

            this.setState({
                city: city,
                school: school,
                class: classNum,
            });
        } else {
            let {city, school, teacher} = user;
            let classNum = user.class;

            this.setState({
                city: city ?? '',
                school: school ?? '',
                class: classNum ?? '',
                teacher: teacher ?? ''
            });
        }
    };

    reFetchUser = () => {
        const {mainStore} = this.props;

        axios.post('/api/init', {
            auth: this.props.auth
        }).then(r => {
            const result = r.data;

            if (!result.status) throw new Error('Failed to re-load user');

            mainStore.setUser(result.data.user);
        })
    };

    saveProfile = () => {
        const s = this;

        if (!(s.cityValid() && s.schoolValid() && s.classValid() && s.teacherValid())) {
            this.setState({validateForm: true});
            return false;
        }

        this.props.onSending();

        console.log(this.state);

        const regExp = new RegExp('(Школа|шк){0,1}[(номер)*№#\\. ]*', 'ig');
        const school = this.state.school.trim().replace(regExp, '');

        axios({
            method: 'post',
            url: '/api/profile/store',
            data: {
                city: this.state.city.trim(),
                school: school,
                class: this.state.class,
                teacher: this.state.teacher.trim(),
                auth: this.props.auth
            }
        }).then(response => {
            if (!response.data.status) throw new Error('Profile store failed');
            this.props.onResult();
            this.reFetchUser();
        }).catch(e => {
            console.log(e);
            return false;
        }).finally(this.props.onClose);
    };

    inputTeacher = (e) => {
        this.setState({
            teacher: e.target.value,
            validateForm: true
        });
    };

    teacherValid = () => {
        const val = this.state.teacher.trim();
        return val.length >=10 && /[^a-z0-9]/i.test(val);
    };

    inputCity = (e) => {
        this.setState({
            city: e.target.value,
            validateForm: true
        });
    };

    cityValid = () => {
        const city = this.state.city.trim();
        return city.length >= 2 && /^[а-я \-\.]+$/i.test(city);
    };

    inputSchool = (e) => {
        this.setState({
            school: e.target.value,
            validateForm: true
        });
    };

    schoolValid = () => {
        const school = this.state.school.trim();
        return school.length > 0;
    };

    inputClass = (e) => {
        this.setState({
            class: parseInt(e.target.value),
            classIsValid: true,
            validateForm: true
        })
    };

    classValid = () => {
        return true;
    };

    fetchProfile = () => {
        return axios({
            method: 'post',
            url: '/api/profile/get',
            data: {
                auth: this.props.auth
            }
        }).then(response => {
            return response.data.data.user;
        })
    };

    render() {
        const {city, school, teacher} = this.state;
        const PLATFORM = this.props.platform;
        const IS_ANDROID = PLATFORM === ANDROID;
        const IS_IOS = PLATFORM === IOS;
        const left = IS_ANDROID ? <PanelHeaderButton onClick={this.props.onClose}><Icon24Cancel /></PanelHeaderButton> : <PanelHeaderButton onClick={this.saveProfile}>Готово</PanelHeaderButton>;
        const right = IS_IOS ? <PanelHeaderButton onClick={this.props.onClose}><Icon24Dismiss /></PanelHeaderButton> : <PanelHeaderButton onClick={this.saveProfile}>Готово</PanelHeaderButton>;

        return (
            <ModalRoot
                activeModal={this.props.show ? 'student_profile' : null}
                onClose={this.props.onClose}
            >
                <ModalPage
                    id="student_profile"
                    header={
                        <ModalPageHeader left={left} right={right}>
                            Анкета ученика
                        </ModalPageHeader>
                    }
                >
                    <Div style={{ paddingTop: 0, paddingBottom: 0 }}>
                        <Headline weight="medium">
                            Вы впервые обмениваете оценки на баллы. Пожалуйста, заполните немного информации о себе:
                        </Headline>
                    </Div>

                    <div className="ProfileForm">
                        <FormLayout>
                            <Input
                                top="Город"
                                placeholder="Ваш город"
                                value={this.state.city}
                                onInput={this.inputCity}
                                onChange={this.inputCity}
                                status={city === '' && !this.state.validateForm ? 'default' : this.cityValid() ? 'valid' : 'error'}
                            />

                            <Input
                                top="Школа"
                                placeholder="Ваша школа"
                                value={this.state.school}
                                onInput={this.inputSchool}
                                onChange={this.inputSchool}
                                status={school === '' && !this.state.validateForm ? 'default' : this.schoolValid() ? 'valid' : 'error'}
                            />

                            <Input
                                top="Классный руководитель"
                                placeholder="ФИО"
                                value={this.state.teacher}
                                onInput={this.inputTeacher}
                                onChange={this.inputTeacher}
                                spellCheck={false}
                                status={teacher === '' && !this.state.validateForm ? 'default' : this.teacherValid() ? 'valid' : 'error'}
                            />

                            <Select
                                top="Класс"
                                value={this.state.class}
                                defaultValue={1}
                                onChange={this.inputClass}
                                status={city || school || teacher ? 'valid' : 'default'}
                            >
                                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map((num) =>
                                    <option value={num} key={num}>{num}</option>
                                )}
                            </Select>
                        </FormLayout>
                    </div>
                </ModalPage>
            </ModalRoot>
        );
    }

}

ProfileModal.propTypes = {
    onSending: PropTypes.func,
    onResult: PropTypes.func,
    onClose: PropTypes.func,
    profile: PropTypes.object
};

ProfileModal.defaultProps = {
    onResult: () => {}
};

export default withPlatform(ProfileModal);