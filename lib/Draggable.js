import React from "react";
import PropTypes from "prop-types";
import { View, TouchableOpacity } from "react-native";
import {
  PanGestureHandler,
  State,
  TapGestureHandler
} from "react-native-gesture-handler";
import Interactable from "react-native-interactable";
import { DragContext } from "./DragContainer";

export const DROP_ZONE_AXIS = {
  x: "x",
  y: "y",
  xy: "xy"
};

class Draggable extends React.Component {
  static defaultProps = {
    delay: 100
  };

  constructor(props) {
    super(props);
    this.displayName = "Draggable";
    this._initiateDrag = this._initiateDrag.bind(this);
  }

  onPress = event => {
    console.log(event.nativeEvent.state, State);
    if (State.BEGAN === event.nativeEvent.state && !this.props.disabled) {
      this.dragTimer = window.setTimeout(this._initiateDrag, this.props.delay);
    } else if (State.END === event.nativeEvent.state) {
      this.cancelDrag();
      this.props.finishDrag(this.props.data, true)();
      if (this.props.onPress) {
        this.props.onPress(this.props.data);
      }
    } else {
      this.cancelDrag();
    }
  };

  cancelDrag = () => {
    clearTimeout(this.dragTimer);
    this.dragTimer = null;
  };

  componentWillUnmount() {
    this.cancelDrag();
  }

  _initiateDrag = () => {
    if (this.isDragging || this.props.disabled) {
      return;
    }

    this.props.onDragStart({
      id: this.props.data
    });
  };

  get isDragging() {
    return this.props.selectedId === this.props.data;
  }

  render() {
    const {
      disabled,
      panId,
      tapId,
      activeOpacity,
      style,
      simultaneousHandlers = [],
      gravityPoints,
      springPoints,
      frictionAreas,
      animatedNativeDriver = true,
      dragToss,
      usePanRecognizer = false,
      animatedValueY,
      alertAreas,
      ...otherProps
    } = this.props;

    return (
      <TapGestureHandler
        {...otherProps}
        id={tapId}
        maxDelayMs={0}
        enabled
        onHandlerStateChange={this.onPress}
        simultaneousHandlers={simultaneousHandlers}
      >
        <Interactable.View
          onDrag={this.props.onDragEnd(this.props.data)}
          onSnap={this.props.finishDrag(this.props)}
          gravityPoints={gravityPoints}
          springPoints={springPoints}
          dragWithSpring={{ tension: 2000, damping: 0.5 }}
          animatedNativeDriver={animatedNativeDriver}
          animatedValueY={animatedValueY}
          frictionAreas={frictionAreas}
          alertAreas={alertAreas}
          dragToss={dragToss}
          dragEnabled
          snapPoints={[
            {
              x: 0,
              y: 0,
              id: "start",
              damping: 0.75
            }
          ]}
          boundaries={
            !this.isDragging
              ? {
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0
                }
              : undefined
          }
        >
          <View
            ref={wrapper => (this.wrapper = wrapper)}
            style={[this.props.style]}
          >
            {React.Children.map(this.props.children, child => {
              return React.cloneElement(child, { ghost: this.isDragging });
            })}
          </View>
        </Interactable.View>
      </TapGestureHandler>
    );
  }
}

export default props => {
  return (
    <DragContext.Consumer>
      {({
        selectedId,
        onDragStart,
        onDrop,
        onDragEnd,
        finishDrag,
        hasMoved
      }) => {
        return (
          <Draggable
            selectedId={selectedId}
            finishDrag={finishDrag}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            hasMoved={hasMoved}
            {...props}
          />
        );
      }}
    </DragContext.Consumer>
  );
};
