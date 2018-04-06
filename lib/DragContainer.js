import React from "react";
import PropTypes from "prop-types";
import {
  View,
  PanResponder,
  Modal,
  Easing,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback
} from "react-native";
import {
  PanGestureHandler,
  TapGestureHandler,
  State
} from "react-native-gesture-handler";

global.Easing = Easing;

const allOrientations = [
  "portrait",
  "portrait-upside-down",
  "landscape",
  "landscape-left",
  "landscape-right"
];

class DragModal extends React.Component {
  render() {
    let { startPosition, activeTapGestureId = "dropTap" } = this.props.content;
    return (
      <Modal
        transparent={true}
        supportedOrientations={allOrientations}
        onRequestClose={() => {}}
      >
        <TapGestureHandler
          id="dropTap"
          onHandlerStateChange={state =>
            State.ACTIVE === state && this.props.drop()
          }
        >
          <Animated.View
            style={{
              transform: this.props.location.getTranslateTransform()
            }}
          >
            {this.props.content.children}
          </Animated.View>
        </TapGestureHandler>
      </Modal>
    );
  }
}

class DragContainer extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = "DragContainer";

    this.location = new Animated.ValueXY();

    this.state = {};

    this.dropZones = [];
    this.draggables = [];
    this.onDrag = this.onDrag.bind(this);
    this._handleDragging = this._handleDragging.bind(this);
    this._handleDrop = this._handleDrop.bind(this);
    this._listener = this.location.addListener(this._handleDragging);
    this.updateZone = this.updateZone.bind(this);
    this.removeZone = this.removeZone.bind(this);
  }

  static propTypes = {
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func
  };

  componentWillUnmount() {
    if (this._listener) this.location.removeListener(this._listener);
  }

  getDragContext() {
    return {
      dropZones: this.dropZones,
      onDrag: this.onDrag,
      dragging: this.state.draggingComponent,
      updateZone: this.updateZone,
      removeZone: this.removeZone
    };
  }

  getChildContext() {
    return { dragContext: this.getDragContext() };
  }

  static childContextTypes = {
    dragContext: PropTypes.any
  };

  updateZone(details) {
    let zone = this.dropZones.find(x => x.ref === details.ref);
    if (!zone) {
      this.dropZones.push(details);
    } else {
      let i = this.dropZones.indexOf(zone);
      this.dropZones.splice(i, 1, details);
    }
  }

  removeZone(ref) {
    let i = this.dropZones.find(x => x.ref === ref);
    if (i !== -1) {
      this.dropZones.splice(i, 1);
    }
  }

  inZone({ x, y }, zone) {
    return (
      zone.x <= x &&
      zone.width + zone.x >= x &&
      zone.y <= y &&
      zone.height + zone.y >= y
    );
  }
  _addLocationOffset(point) {
    if (!this.state.draggingComponent) return point;
    return {
      x: point.x + this.state.draggingComponent.startPosition.width / 2,
      y: point.y + this.state.draggingComponent.startPosition.height / 2
    };
  }

  _handleDragging(point) {
    this._point = point;
    if (this._locked || !point) return;
    this.dropZones.forEach(zone => {
      if (this.inZone(point, zone)) {
        zone.onEnter(point);
      } else {
        zone.onLeave(point);
      }
    });
  }

  _handleDrop() {
    let hitZones = [];
    this.dropZones.forEach(zone => {
      if (!this._point) return;
      if (this.inZone(this._point, zone)) {
        hitZones.push(zone);
        zone.onDrop(this.state.draggingComponent.data);
      }
    });
    if (this.props.onDragEnd)
      this.props.onDragEnd(this.state.draggingComponent, hitZones);
    if (
      !hitZones.length &&
      this.state.draggingComponent &&
      this.state.draggingComponent.ref
    ) {
      this._locked = true;
      return Animated.timing(this.location, {
        duration: 400,
        easing: Easing.elastic(1),
        toValue: {
          x: 0, //this._offset.x - x,
          y: 0 //his._offset.y - y
        }
      }).start(() => {
        this._locked = false;
        this._handleDragging({ x: -100000, y: -100000 });
        this.setState({
          draggingComponent: null
        });
      });
    }
    this._handleDragging({ x: -100000, y: -100000 });
    this.setState({
      draggingComponent: null
    });
  }

  handleRelease = () => {
    if (!this.state.draggingComponent) return;
    //Ensures we exit all of the active drop zones
    this._handleDrop();
  };

  onDrag(ref, children, data) {
    ref.measure((...args) => {
      if (this._listener) this.location.removeListener(this._listener);
      let location = new Animated.ValueXY();
      this._listener = location.addListener(args =>
        this._handleDragging(this._addLocationOffset(args))
      );
      this._offset = { x: args[4], y: args[5] };
      location.setOffset(this._offset);

      this.location = location;

      this.setState(
        {
          draggingComponent: {
            ref,
            data,
            children: React.Children.map(children, child => {
              return React.cloneElement(child, { dragging: true });
            }),
            startPosition: {
              x: args[4],
              y: args[5],
              width: args[2],
              height: args[3]
            }
          }
        },
        () => {
          if (this.props.onDragStart)
            this.props.onDragStart(this.state.draggingComponent);
        }
      );
    });
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.enabled &&
      !this.props.enabled &&
      this.state.draggingComponent
    ) {
      this._handleDrop();
    }
  }

  render() {
    const {
      style,
      children,
      onDragStart,
      onDragEnd,
      id = "root",
      enabled = true,
      ...otherProps
    } = this.props;

    return (
      <PanGestureHandler
        id={root}
        {...otherProps}
        enabled={enabled}
        onGestureEvent={Animated.event([
          {
            nativeEvent: {
              translationX: this.location.x,
              translationY: this.location.y
            }
          }
        ])}
        onCancelled={this.handleRelease}
        onEnded={this.handleRelease}
        onFailed={this.handleRelease}
      >
        <View style={[{ flex: 1 }, this.props.style]}>
          {this.props.children}
          {this.state.draggingComponent ? (
            <DragModal
              content={this.state.draggingComponent}
              location={this.location}
              drop={this._handleDrop}
            />
          ) : null}
        </View>
      </PanGestureHandler>
    );
  }
}

export default DragContainer;
