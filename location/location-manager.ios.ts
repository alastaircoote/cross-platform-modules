﻿import enums = require("ui/enums");
import locationModule = require("location");

class LocationListenerImpl extends NSObject implements CLLocationManagerDelegate {
    public static ObjCProtocols = [CLLocationManagerDelegate];

    static new(): LocationListenerImpl {
        return <LocationListenerImpl>super.new();
    }

    private _onLocation: (location: locationModule.Location) => any;
    private _onError: (error: Error) => any
    private _options: locationModule.Options;
    private _maximumAge: number;

    public initWithLocationErrorOptions(location: (location: locationModule.Location) => any, error?: (error: Error) => any, options?: locationModule.Options): LocationListenerImpl {
        this._onLocation = location;
        
        if (error) {
            this._onError = error;
        }

        if (options) {
            this._options = options;
        }

        this._maximumAge = (this._options && ("number" === typeof this._options.maximumAge)) ? this._options.maximumAge : undefined;

        return this;
    }

    public locationManagerDidUpdateLocations(manager, locations): void {
        for (var i = 0; i < locations.count; i++) {
            var location = LocationManager._locationFromCLLocation(locations.objectAtIndex(i));
            if (this._maximumAge) {
                if (location.timestamp.valueOf() + this._maximumAge > new Date().valueOf()) {
                    this._onLocation(location);
                }
            }
            else {
                this._onLocation(location);
            }
        }
    }

    public locationManagerDidFailWithError(manager, error): void {
        // console.error('location error received ' + error.localizedDescription);
        if (this._onError) {
            this._onError(new Error(error.localizedDescription));
        }
    }
}

export class LocationManager {
    // in meters
    // we might need some predefined values here like 'any' and 'high'
    public desiredAccuracy: number;

    // The minimum distance (measured in meters) a device must move horizontally before an update event is generated.
    public updateDistance: number;

    private iosLocationManager: CLLocationManager;
    private listener: any;

    public static _locationFromCLLocation(clLocation: CLLocation): locationModule.Location {
        var location = new locationModule.Location();
        location.latitude = clLocation.coordinate.latitude;
        location.longitude = clLocation.coordinate.longitude;
        location.altitude = clLocation.altitude;
        location.horizontalAccuracy = clLocation.horizontalAccuracy;
        location.verticalAccuracy = clLocation.verticalAccuracy;
        location.speed = clLocation.speed;
        location.direction = clLocation.course;
        location.timestamp = new Date(clLocation.timestamp.timeIntervalSince1970 * 1000);
        location.ios = clLocation;
        //console.dump(location);
        return location;
    }

    private static iosLocationFromLocation(location: locationModule.Location): CLLocation {
        var hAccuracy = location.horizontalAccuracy ? location.horizontalAccuracy : -1;
        var vAccuracy = location.verticalAccuracy ? location.verticalAccuracy : -1;
        var speed = location.speed ? location.speed : -1;
        var course = location.direction ? location.direction : -1;
        var altitude = location.altitude ? location.altitude : -1;
        var timestamp = location.timestamp ? NSDate.dateWithTimeIntervalSince1970(location.timestamp.getTime()) : null;
        var iosLocation = CLLocation.alloc().initWithCoordinateAltitudeHorizontalAccuracyVerticalAccuracyCourseSpeedTimestamp(CLLocationCoordinate2DMake(location.latitude, location.longitude), altitude, hAccuracy, vAccuracy, course, speed, timestamp);
        return iosLocation;
    }

    public static isEnabled(): boolean {
        if (CLLocationManager.locationServicesEnabled()) {
            // CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedWhenInUse and CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedAlways are options that are available in iOS 8.0+
            // while CLAuthorizationStatus.kCLAuthorizationStatusAuthorized is here to support iOS 8.0-.
            return (CLLocationManager.authorizationStatus() === CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedWhenInUse 
                || CLLocationManager.authorizationStatus() === CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedAlways
                || CLLocationManager.authorizationStatus() === CLAuthorizationStatus.kCLAuthorizationStatusAuthorized);
        }
        return false;
    }

    public static distance(loc1: locationModule.Location, loc2: locationModule.Location): number {
        if (!loc1.ios) {
            loc1.ios = LocationManager.iosLocationFromLocation(loc1);
        }
        if (!loc2.ios) {
            loc2.ios = LocationManager.iosLocationFromLocation(loc2);
        }
        return loc1.ios.distanceFromLocation(loc2.ios);
    }

    constructor() {
        this.desiredAccuracy = enums.Accuracy.any;
        this.updateDistance = kCLDistanceFilterNone;
        this.iosLocationManager = new CLLocationManager();
    }

    public startLocationMonitoring(onLocation: (location: locationModule.Location) => any, onError?: (error: Error) => any, options?: locationModule.Options) {
        if (!this.listener) {
            if (options) {
                if (options.desiredAccuracy) {
                    this.desiredAccuracy = options.desiredAccuracy;
                }
                if (options.updateDistance) {
                    this.updateDistance = options.updateDistance;
                }
            }

            this.listener = LocationListenerImpl.new().initWithLocationErrorOptions(onLocation, onError, options);
            this.iosLocationManager.delegate = this.listener;
            this.iosLocationManager.desiredAccuracy = this.desiredAccuracy;
            this.iosLocationManager.distanceFilter = this.updateDistance;
            this.iosLocationManager.startUpdatingLocation();
        }
    }

    public stopLocationMonitoring() {
        this.iosLocationManager.stopUpdatingLocation();
        this.iosLocationManager.delegate = null;
        this.listener = null;
    }

    get lastKnownLocation(): locationModule.Location {
        var clLocation = this.iosLocationManager.location;
        if (clLocation) {
            return LocationManager._locationFromCLLocation(clLocation);
        }
        return null;
    }
}