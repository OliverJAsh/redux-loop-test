import { createStore } from 'redux';
import { install, loop, Effects } from 'redux-loop';
import { fromJS } from 'immutable';

const firstAction = {
    type: 'FIRST_ACTION',
};

const doSecondAction = (value: any) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                type: 'SECOND_ACTION',
                payload: value,
            });
        });
    });
}

const thirdAction = {
    type: 'THIRD_ACTION',
};

// immutable store state allowed by default, but not required
const initialState = fromJS({
    firstRun: false,
    secondRun: false,
    thirdRun: false,
});

type ReducerFn = (state: any, action: any) => any;
const reducer: ReducerFn = (state, action) => {
    switch(action.type) {

    case 'FIRST_ACTION':
        // Enter a sequence at FIRST_ACTION, SECOND_ACTION and THIRD_ACTION will be
        // dispatched in the order they are passed to batch
        return loop(
            state.set('firstRun', true),
            Effects.batch([
                Effects.promise(doSecondAction, 'hello'),
                Effects.constant(thirdAction)
            ])
        );

    case 'SECOND_ACTION':
        return state.set('secondRun', action.payload);

    case 'THIRD_ACTION':
        return state.set('thirdRun', true);

    default:
        return state;
    }
}

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, initialState, install());

(<any>store
    .dispatch(firstAction))
    .then(() => {
        // dispatch returns a promise for when the current sequence is complete
        // { firstRun: true, secondRun: 'hello', thirdRun: true }
        console.log(store.getState().toJS());
    });
