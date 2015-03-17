import definition = require("ui/web-view");
import view = require("ui/core/view");
import dependencyObservable = require("ui/core/dependency-observable");
import proxy = require("ui/core/proxy");

export module knownEvents {
    export var finished: string = "finished";
}
var urlProperty = new dependencyObservable.Property(
    "url",
    "WebView",
    new proxy.PropertyMetadata("")
    );

var htmlStringProperty = new dependencyObservable.Property(
    "htmlString",
    "WebView",
    new proxy.PropertyMetadata("")
    );

function onUrlPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var webView = <WebView>data.object;

    if (webView._suspendLoading) {
        return;
    }

    webView._loadUrl(data.newValue);
}

function onHTMLStringPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var webView = <WebView>data.object;

    if (webView._suspendLoading) {
        return;
    }

    webView._loadString(data.newValue);
}

// register the setNativeValue callback
(<proxy.PropertyMetadata>urlProperty.metadata).onSetNativeValue = onUrlPropertyChanged;
(<proxy.PropertyMetadata>htmlStringProperty.metadata).onSetNativeValue = onHTMLStringPropertyChanged;

export class WebView extends view.View implements definition.WebView {

    public static urlProperty = urlProperty;
    public static htmlStringProperty = htmlStringProperty;

    public _suspendLoading: boolean;
    public shouldNavigate;

    constructor() {
        super();
    }

    get url(): string {
        return this._getValue(WebView.urlProperty);
    }

    set url(value: string) {
        this._setValue(WebView.urlProperty, value);
    }

    get htmlString(): string {
        return this._getValue(WebView.htmlStringProperty);
    }

    set htmlString(value: string) {
        this._setValue(WebView.htmlStringProperty, value);
    }

    public _onFinished(url: string, error?: string) {

        this._suspendLoading = true;
        this.url = url;
        this._suspendLoading = false;

        var args = <definition.FinishedEventData>{
            eventName: knownEvents.finished,
            object: this,
            url: url,
            error: error
        };

        this.notify(args);
    }

    public _loadUrl(url: string) {
        throw new Error("This member is abstract.");
    }

    public _loadString(html: string) {
        throw new Error("This member is abstract.");
    }

    get canGoBack(): boolean {
        throw new Error("This member is abstract.");
    }

    get canGoForward(): boolean {
        throw new Error("This member is abstract.");
    }

    public goBack() {
        throw new Error("This member is abstract.");
    }

    public goForward() {
        throw new Error("This member is abstract.");
    }

    public reload() {
        throw new Error("This member is abstract.");
    }
} 