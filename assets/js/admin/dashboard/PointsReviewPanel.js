import React from "react";
import ReviewItem from "./ReviewItem";
import axios from "axios";
import '../../../css/dashboard.css';
import {ScreenSpinner, Div, PanelHeader, TabsItem, Tabs, Snackbar} from "@vkontakte/vkui";
import PropTypes from 'prop-types';
import {inject, observer} from "mobx-react";

@inject("mainStore")
@observer
class PointsReviewPanel extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeTab: 'unverified',
            reviews: [],
            profiles: [],
            page: 1,
            snack: null,
            ajaxInProgress: false
        };

        this.scrollLocked = false;
    }

    ajaxProgress = (status) => {
        this.props.onPopout(status ? <ScreenSpinner /> : null);

        this.setState({
            ajaxInProgress: status,
        })
    };

    fetchPoints = (type, page = 1) => {
        this.ajaxProgress(true);

        axios({
            method: 'post',
            url: `${prefix}/admin/points/get`,
            data: {
                verify: type === 'verified',
                cancel: type === 'cancelled',
                page: page,
                auth: this.props.mainStore.auth
            }
        }).then(r => {
            if (!r.data.status) throw new Error("Failed to fetch points");

            const points = r.data.data.reviews;

            if (points.length === 0) {
                this.ajaxProgress(false);
                return false;
            }

            this.setState({
                reviews: [...this.state.reviews, ...points]
            });

            this.scrollLocked = false;
        }).catch(e => {
            this.snack('Не удалось получить данные об оценках');
        }).finally(() => {
            this.ajaxProgress(false);
        })
    };

    docBottomIsReached = () => {
        return document.body.offsetHeight + window.pageYOffset >= document.body.scrollHeight - 100;
    };

    scrollHandler = () => {
        if (!this.scrollLocked && this.docBottomIsReached()) {
            this.setState((state) => {
                return {
                    page: state.page + 1
                };
            }, () => {
                const { page } = this.state;

                this.scrollLocked = true;
                this.fetchPoints(this.state.activeTab, page);
            });
        }
    };

    tab = (name) => {
        this.setState({
            activeTab: name,
            reviews: [],
            page: 1
        }, () => {
            this.fetchPoints(name);
        });
    };

    snack = (text) => {
        this.setState({
            snack: <Snackbar onClose={() => { this.setState({snack: null}) }}>{text}</Snackbar>
        })
    };

    componentDidMount() {
        this.fetchPoints('unverified');
        window.addEventListener('scroll', this.scrollHandler);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.scrollHandler);
    }

    render() {
        return (
            <>
                <PanelHeader>
                    Оценки
                </PanelHeader>

                <Tabs mode="buttons">
                    <TabsItem
                        onClick={() => {this.tab('unverified')}}
                        selected={this.state.activeTab === 'unverified'}
                    >
                        Новые
                    </TabsItem>
                    <TabsItem
                        onClick={() => {this.tab('verified')}}
                        selected={this.state.activeTab === 'verified'}
                    >
                        Одобрены
                    </TabsItem>
                    <TabsItem
                        onClick={() => {this.tab('cancelled')}}
                        selected={this.state.activeTab === 'cancelled'}
                    >
                        Отклонены
                    </TabsItem>
                </Tabs>

                <Div>
                    {this.state.snack}

                    {this.state.ajaxInProgress === false && (!this.state.reviews || this.state.reviews.length === 0) &&
                        <Div>
                            Пусто ...
                        </Div>
                    }

                    {this.state.reviews && this.state.reviews.map((review) =>
                        <ReviewItem
                            key={review.id}
                            user={review.user}
                            photos={review.photos}
                            id={review.id}
                            amount={review.amount}
                            cancel={review.cancel}
                            cancelComment={review.cancel_comment}
                            createdAt={review.created_at}
                            dateAt={review.date_at}
                            approveButton={this.state.activeTab === 'unverified'}
                            onPopout={this.props.onPopout}
                            onModal={this.props.onModal}
                            onCoinsSet={() => {
                                this.setState({
                                    reviews: this.state.reviews.filter(item => item.id !== review.id)
                                })
                            }}
                            onCoinsUpdate={(coins) => {
                                this.setState({
                                    reviews: this.state.reviews.map(item => {
                                        if (item.id === review.id) item.amount = coins;

                                        return item;
                                    })
                                })
                            }}
                            onDeclineRequest={() => {
                                this.setState({
                                    reviews: this.state.reviews.filter(item => item.id !== review.id)
                                })
                            }}
                            onSnack={this.snack}
                        />
                    )}
                </Div>
            </>
        );
    }

}

PointsReviewPanel.propTypes = {
    serviceToken: PropTypes.string,
    onPopout: PropTypes.func,
    onModal: PropTypes.func
};

export default PointsReviewPanel;