import React from "react";
import {withRouter} from "react-router-dom";
import {
    Panel, PanelHeader, PanelHeaderBack, PanelHeaderButton,
    Root, View, Div,
    Title, Text, Button, FormLayout,
    File, Group, Header, Gallery,
    withPlatform,
    Snackbar, Avatar, ScreenSpinner, Progress,
    InfoRow, Tooltip, Button as VKButton, Link as VKLink, Alert,
    Spinner
} from "@vkontakte/vkui";
import {PageDialog} from '@happysanta/vk-app-ui';
import Calendar from "./Calendar";
import {Icon24Camera, Icon16Done, Icon44Spinner} from "@vkontakte/icons";
import axios from "axios";
import bridge from '@vkontakte/vk-bridge';
import moment from 'moment';
import 'moment-timezone';
import PopupCanceled from './PopupCanceled';
import {declOfNum, monthRus, randomStr} from "../utils";
import classNames from "classnames";
import ProfileModal from './ProfileModal';
import {inject, observer} from "mobx-react";

moment.tz.setDefault("Europe/Moscow");

function VKRequestRefusedByUser(message, code) {
    this.message = message;
    this.code = code;
}

@inject("mainStore")
@observer
class GetCoinsPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeModal: null,
            modalHistory: [],
            snackbar: null,
            popout: null,
            progress: null,
            photos: [],
            city: '',
            cityIsValid: null,
            school: '',
            schoolIsValid: null,
            class: 1,
            classIsValid: null,
            teacher: '',
            teacherIsValid: null,
            dateAt: moment(),
            validateForm: false,
            formIsValid: false,
            processedDates: [],
            totalCoinsPerMonth: 0,
            tooltip: false,
            popupWaiting: false,
            popupCanceled: null,
            bestResultDay: null,
            bestResultMonth: null
        };

        this.userProfileIsExist = false;
        this.inputFile = React.createRef();
        this.calendarWidth = this.props.this.mobile ? (document.documentElement.clientWidth - 30) : 400;
    }

    userDeclineHandler = (e) => {
        console.log('Bridge event handler: ', e);

        try {
            const type = e.detail.type;

            if (type === 'VKWebAppGetAuthTokenFailed' || type === 'VKWebAppAccessTokenFailed')
                throw new VKRequestRefusedByUser('Для корректной работы приложению необходим доступ к профилю', 1);
        } catch (e) {
            console.log(e);

            this.showSnackbar(e.message);
        }
    };

    calendar = () => {
        axios({
            url: '/api/calendar/get',
            method: 'post',
            data: {
                auth: this.props.this.auth,
            }
        }).then(response => {
            const dates = [];

            response.data.data.forEach(item => {
                item.date_at = moment(item.date_at);
                dates.push(item);
            });

            this.setState({
                processedDates: dates
            });
        })
    };

    canViewTooltip = (lifeTime = 3600 * 8) => {
        bridge.send("VKWebAppStorageGet", {
            "keys": ["tooltip_calendar"]
        }).then(data => {
            const curTime = moment().unix();
            let viewedAt = NaN;

            data.keys.forEach(item => {
                if (item.key === "tooltip_calendar") viewedAt = parseInt(item.value)
            });

            this.setState({
                tooltip: curTime - (isNaN(viewedAt) ? curTime - lifeTime : viewedAt) >= lifeTime
            });
        });
    };

    tooltipCalendarClose = () => {
        bridge.send("VKWebAppStorageSet", {
            "key": "tooltip_calendar",
            "value": moment().unix().toString()
        });

        this.setState({tooltip: false});
    };

    componentDidMount() {
        bridge.subscribe(this.userDeclineHandler);

        this.calendar();
        this.setMonthTotal(moment());
        this.fetchBestResults();
        this.canViewTooltip();

        this.messageSubscribe();
        if (window.location.hash === '#profile') this.studentProfileModal(true);
    }

    componentWillUnmount() {
        bridge.unsubscribe(this.userDeclineHandler);
    }

    messageSubscribe = () => {
        bridge.send("VKWebAppAllowMessagesFromGroup", {
            "group_id": GROUP_ID,
            "key": randomStr()
        }).then(data => {
            if (!data.result) throw new Error('Message declined');

        }).catch(e => {
            this.alert();
        })
    };

    alert = () => {
        this.setState({
            popout: <Alert
                actions={[{
                    title: 'Отмена',
                    autoclose: true,
                    mode: 'cancel'
                }, {
                    title: 'Разрешить',
                    autoclose: true,
                    action: () => {
                        this.messageSubscribe()
                    },
                }]}
                onClose={() => { this.setState({ popout: null }) }}
            >
                <h2>Подписка на сообщения от сообщества</h2>
                <p>Для получения уведомлений об оценках вы должны разрешить сообщения от сообщества.</p>
            </Alert>
        });
    };

    inputFileChange = () => {
        const reader = new FileReader();
        const files = this.inputFile.current.files;

        if (files.length === 0) return false;

        const file = files[files.length - 1];

        reader.onload = (e) => {
            const photo = e.target.result;
            const photos = this.state.photos;
            const blob = new Blob([new Uint8Array(photo)], {type: file.type});

            photos.push({
                url: URL.createObjectURL(blob),
                name: file.name,
                blob: blob
            });

            this.setState({
                photos: photos
            });
        };

        reader.readAsArrayBuffer(file);
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

    profileExist = async () => {
        if (this.userProfileIsExist) return true;

        const data = new FormData();

        data.append('auth', this.props.this.auth);

        const response = await axios({
            method: 'post',
            url: '/api/profile/exist',
            data: data
        });

        return response.data.data.exist;
    };

    getAccessToken = async () => {
        const token = await bridge.send("VKWebAppGetAuthToken", {
            "app_id": APP_ID,
            "scope": ""
        });

        return token.access_token
    };

    getCurrentUser = async token => {
        const user = await bridge.send("VKWebAppCallAPIMethod", {
            "method": "users.get",
            "request_id": randomStr(),
            "params": {"fields": "city,schools", "v": "5.124", "access_token": token}
        });

        return user.response[0];
    };

    /**
     *
     * @param visible
     * @return boolean
     */
    studentProfileModal = async (visible) => {
        if (!visible) {
            this.setState({
                activeModal: null
            });

            return true;
        }

        this.setState({
            activeModal: 'student_profile'
        });

        let city = this.state.city;
        let school = this.state.school;
        let classNum = this.state.class;

        try {
            const token = await this.getAccessToken();
            const profile = await this.getCurrentUser(token);
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
            class: classNum
        });

        return true;
    };

    send = async () => {
        const profileIsExist = await this.profileExist();

        if (!profileIsExist) return this.studentProfileModal(true);

        const data = new FormData();

        this.state.photos.map((photo, index) => {
            // data.append('images[]', photo.blob, 'photo_' + index);
            data.append('images[]', photo.blob, photo.name);
        });

        data.append('date_at', (this.state.dateAt.unix()).toString());
        data.append('auth', this.props.this.auth);

        axios({
            method: 'post',
            url: '/api/points/store',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
            },
            data: data,
            onUploadProgress: progressEvent => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                this.progressBar(percentCompleted);
            }
        }).then(response => {
            if (!response.data.status) throw "Не удалось сохранить фото";

            this.calendar();
            this.showSnackbar('Успешно отправлено');
            this.setState({photos: []});

            window.history.back();
        }).catch(e => {
            this.showSnackbar(e.code === 413 ? 'Ошибка: Слишком большой файл' : 'Ошибка: ' + e.message);
        }).finally(() => {
            this.progressBar(false);
        });
    };

    progressBar = (percent) => {
        this.setState({
            progress: percent === false ? null : <Progress value={percent} />
        })
    };

    saveProfile = async () => {
        const formValid = this.cityValid() && this.schoolValid() && this.classValid() && this.teacherValid();

        if (!formValid) {
            this.setState({validateForm: true});
            return false;
        }

        this.studentProfileModal(false);
        this.spinner(true);

        const store = () => {
            return axios({
                method: 'post',
                url: '/api/profile/store',
                data: {
                    city: this.state.city.trim(),
                    school: this.state.school.trim(),
                    class: this.state.class,
                    teacher: this.state.teacher.trim(),
                    auth: this.props.this.auth
                }
            }).then(response => {
                return response.data.status;
            }).catch((e) => {
                console.log(e);
                return false;
            });
        };

        const profileStore = await store();

        this.spinner(false);

        if (!profileStore) {
            this.showSnackbar('Не удалось сохранить анкету');
            throw "Не удалось сохранить анкету";
        }

        this.userProfileIsExist = true;

        if (this.state.photos.length > 0) this.send();
    };

    backModal = () => {
        this.setState({
            activeModal: null
        });
    };

    spinner = (start) => {
        this.setState({
            popout: start ? <ScreenSpinner /> : null
        });
    };

    showSnackbar = (text) => {
        if (this.state.snackbar) return;

        const blueBackground = {
            backgroundColor: 'var(--accent)'
        };

        this.setState({
            snackbar:
                <Snackbar
                    layout="vertical"
                    onClose={() => this.setState({ snackbar: null })}
                    before={<Avatar size={24} style={blueBackground}><Icon16Done fill="#fff" width={14} height={14} /></Avatar>}
                >
                    {text}
                </Snackbar>
        });
    };

    selectDate = (day, type, dayIntoCurMonth, item) => {
        this.setState({
            dateAt: day,
        });

        if (type === 'waiting') {
            this.setState({ popupWaiting: true });
        } else if (type === 'canceled') {
            this.setState({
                popupCanceled:
                    <PopupCanceled
                        onClose={() => { this.setState({popupCanceled: null}) }}
                        onButtonClick={() => { if (dayIntoCurMonth) {this.props.open('view1', 'upload')} }}
                        mobile={this.props.mobile}
                        {...item}
                    />
            });
        } else if (type === 'default' && dayIntoCurMonth) {
            this.props.open('view1', 'upload');
        }
    };

    fetchMonthTotal = (monthNum) => {
        return axios({
            method: 'post',
            url: '/api/profile/reports/points-per-month',
            data: {
                month: parseInt(monthNum),
                auth: this.props.this.auth
            }
        }).then(response => {
            return response.data.data.total;
        }).catch((e) => {
            console.log(e);
            return 0;
        })
    };

    fetchBestResults = () => {
        return axios({
            method: 'post',
            url: '/api/profile/reports/best-results',
            data: {
                auth: this.props.this.auth
            }
        }).then(response => {
            const data = response.data.data;

            this.setState({
                bestResultDay: data.report_day,
                bestResultMonth: data.report_month,
            })
        })
    };

    setMonthTotal = async (e) => {
        const total = await this.fetchMonthTotal(e.format('M'));

        this.setState({
            totalCoinsPerMonth: total,
            dateAt: e
        });
    };

    render() {
        const onProfileStored = () => {
            this.userProfileIsExist = true;

            if (this.state.photos.length > 0) this.send();
        };
        const modal =
            <ProfileModal
                show={this.state.activeModal}
                onSending={() => { this.setState({ activeModal: null, popout: <ScreenSpinner/> }) }}
                onResult={onProfileStored}
                onClose={() => { this.setState({ activeModal: null, popout: null }) }}
                auth={this.props.this.auth}
            />;
        const bestDay = this.state.bestResultDay;
        const bestMonth = this.state.bestResultMonth;
        const coins = points => {return declOfNum(points, ['умникоин', 'умникоина', 'умникоинов'])};
        const Span = (props) => {
            return (
                <Text weight="semibold" style={{ display: 'inline-block' }}>{props.text}</Text>
            );
        };

        return (
            <Root activeView={this.props.activeView}>
                <View id="view1" activePanel={this.props.activePanel} modal={modal} popout={this.state.popout}>
                    <Panel id="main">
                        <PanelHeader
                            addon={<PanelHeaderButton onClick={() => { window.history.back() }}>Назад</PanelHeaderButton>}
                            left={<PanelHeaderBack onClick={() => { window.history.back() }} />}
                        >
                            Обмен оценок
                        </PanelHeader>

                        <Div>
                            <Title level="1" weight="semibold" style={{ marginBottom: 16 }}>
                                Загружай оценки 📘 - получай 💎 умникоины
                            </Title>

                            <Text weight="regular" style={{ color: 'var(--text_secondary)' }}>
                                Чтобы получить умникоины вы должны прислать скриншоты/фотографии дневника или электронного журнала за этот месяц.
                            </Text>
                        </Div>

                        <Tooltip
                            text="Выберите дату для загрузки оценок"
                            offsetX={15}
                            onClose={this.tooltipCalendarClose}
                            isShown={this.state.tooltip}
                        >
                            <Div style={{ width: this.calendarWidth, paddingBottom: 0 }}>
                                <Calendar
                                    onChange={this.selectDate}
                                    onMonthChange={this.setMonthTotal}
                                    currentDay={this.state.dateAt}
                                    totalCoinsPerMonth={this.state.totalCoinsPerMonth}
                                    processedDates={this.state.processedDates}
                                />
                            </Div>
                        </Tooltip>

                        {bestDay &&
                            <Div>
                                <Title level="1" weight="semibold" style={{ marginBottom: 15 }}>🔥 Лучший ваш результат 🔥</Title>
                                <div>
                                    <Text>
                                        <Span text={bestDay.created_at}/> вы конвертировали <Span text={bestDay.amount}/> {coins(bestDay.amount)} <br/>
                                        В <Span text={monthRus(bestMonth.month_num, 2)}/> вы собрали <Span text={bestMonth.amount}/> {coins(bestMonth.amount)}
                                    </Text>
                                </div>
                            </Div>
                        }

                        {this.state.snackbar}

                        {this.state.popupWaiting &&
                            <PageDialog
                                onClose={() => {this.setState({popupWaiting:false})}}
                                className={classNames({
                                    "PageDialog": true,
                                    "PageDialog__window--fixed-width": true,
                                    "PageDialog__window--mobile": this.props.mobile
                                })}
                            >
                                <div style={{ width: 44, margin: '0 auto 15px auto' }}>
                                    {/*<Icon44Spinner style={{ color: 'var(--accent)' }}/>*/}
                                    <Spinner size="large" style={{ color: 'var(--accent)', marginTop: 20 }} />
                                </div>

                                <Title level="2" weight="semibold" style={{ marginBottom: 5, textTransform: 'uppercase' }}>
                                    Конвертация оценок
                                </Title>

                                <Title level="3" weight="semibold" style={{ marginBottom: 16, textTransform: 'uppercase' }}>
                                    {this.state.dateAt.format('D')} {monthRus(this.state.dateAt.month())} {this.state.dateAt.format('YYYY')}
                                </Title>

                                <Text weight="regular" style={{ marginBottom: 16 }}>
                                    Модераторы уже приступили к превращению ваших оценок в умникоины.
                                    Этот процесс может занять до 48 часов.
                                    Если после этого времени ваши оценки не конвертировали, то напишите нашему чат-боту.
                                </Text>

                                <Div>
                                    <VKLink href="https://vk.me/schoolspaceru" target="_blank">
                                        <VKButton size="l" mode="primary" style={{ cursor: 'pointer' }}>Чат-бот</VKButton>
                                    </VKLink>
                                </Div>
                            </PageDialog>
                        }

                        {this.state.popupCanceled}
                    </Panel>

                    <Panel id="upload">
                        <PanelHeader
                            addon={<PanelHeaderButton onClick={() => { window.history.back() }}>Назад</PanelHeaderButton>}
                            left={<PanelHeaderBack onClick={() => { window.history.back() }} />}
                        >
                            Загрузка фото
                        </PanelHeader>

                        {this.state.photos.length > 0 &&
                            <Group header={<Header mode="secondary">Загружено фото: {this.state.photos.length}</Header>}>
                                <Gallery
                                    slideIndex={this.state.photos.length > 0 ? this.state.photos.length - 1 : 0}
                                    onChange={() => {}}
                                    slideWidth="100%"
                                    style={{
                                        height: this.state.photos.length > 0 ? 150 : 0,
                                        backgroundColor: 'var(--button_secondary_background)',
                                        transition: 'height 0.3s'
                                    }}
                                    bullets="dark"
                                    align="center"
                                >
                                    {this.state.photos.map((photo, index) =>
                                        <div
                                            key={index}
                                            style={{
                                                backgroundImage: 'url(' + photo.url + ')',
                                                backgroundSize: 'contain',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundColor: 'var(--button_secondary_background)'
                                            }}
                                        />
                                    )}
                                </Gallery>
                            </Group>
                        }

                        <FormLayout>
                            <File top={'Загрузите оценки за ' + this.state.dateAt.format('DD-MM-YYYY')}
                                  before={<Icon24Camera />}
                                  controlSize="xl"
                                  mode="secondary"
                                  multiple
                                  accept="image/jpeg, image/png"
                                  getRef={this.inputFile}
                                  onChange={this.inputFileChange}
                            >
                                Выберите фотографии
                            </File>
                        </FormLayout>

                        {this.state.progress &&
                            <Div>
                                <InfoRow header="Отправляем фото ...">
                                    {this.state.progress}
                                </InfoRow>
                            </Div>
                        }

                        <Div>
                            <Button
                                size="xl"
                                stretched
                                disabled={this.state.photos.length === 0}
                                onClick={this.send}
                            >
                                Отправить на проверку
                            </Button>
                        </Div>
                    </Panel>
                </View>

                <View id='placeholder_view' activePanel={this.props.activePanel}>
                    <Panel id="internet">
                        {this.props.this.state.placeholder}
                    </Panel>
                </View>
            </Root>
        );
    }
}

export default withRouter(withPlatform(GetCoinsPage));