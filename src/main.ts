import { createStore } from 'redux';
import { install, loop, Effects, Effect, EnhancedReducer } from 'redux-loop';

enum ActionTypes { First, Second, Third };
type FirstAction = { type: ActionTypes.First };
type SecondAction = { type: ActionTypes.Second, payload: string }
type ThirdAction = { type: ActionTypes.Third };
type Action = FirstAction | SecondAction | ThirdAction;

const doSecondAction = (value: string): Promise<SecondAction> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                type: 'SECOND_ACTION',
                payload: value,
            });
        });
    });
}

type State = {
    firstRun: boolean
    secondRun: boolean
    thirdRun: boolean
};

const initialState: State = {
    firstRun: false,
    secondRun: false,
    thirdRun: false,
};

const patch = <O, P>(o: O, p: P): O & P => Object.assign({}, o, p);

const reducer: EnhancedReducer<State> = (state: State, action: Action): State | [State, Effect] => {
    switch(action.type) {

    case ActionTypes.First:
        // Enter a sequence at FIRST_ACTION, SECOND_ACTION and THIRD_ACTION will be
        // dispatched in the order they are passed to batch
        return loop(
            patch(state, { firstRun: true }),
            Effects.batch([
                Effects.promise(doSecondAction, 'hello'),
                Effects.constant({ type: ActionTypes.Third })
            ])
        );

    case ActionTypes.Second:
        return patch(state, { secondRun: action.payload })

    case ActionTypes.Third:
        return patch(state, { thirdRun: true })
    }
}

// We have to use the enhancer directly, passing Redux in, to take
// advantage of our typings.
// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
// const store = createStore(reducer, initialState, install());
const store = install()(createStore)(reducer, initialState);

store
    .dispatch({ type: ActionTypes.First })
    .then(() => {
        // dispatch returns a promise for when the current sequence is complete
        // { firstRun: true, secondRun: 'hello', thirdRun: true }
        console.log(store.getState());
    });
