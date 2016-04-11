import commonModule = require("./nativescript-fresco-common");
import utils = require("utils/utils");
import types = require("utils/types");
import application = require("application");
import * as fileSystemModule from "file-system";
import imageSource = require("image-source");

var fs: typeof fileSystemModule;

export function initialize(): void {
    if (application.android) {
        com.facebook.drawee.backends.pipeline.Fresco.initialize(application.android.context);
    }
};

export class FrescoDrawee extends commonModule.FrescoDrawee {
    private _android;
    private imageDrawable;
    private backgroundDrawable;

    public _createUI() {
        this._android = new com.facebook.drawee.view.SimpleDraweeView(this._context);
        this.initDrawee();
    }

    public _clearAndroidReference() {
        this._android.setImageURI(null, null);
        this._android = undefined;
        super._clearAndroidReference();
    }

    get android() {
        return this._android;
    }

    protected onImageUriChanged(args) {
        this.initImage();
    }

    protected onPlaceholderImageUriPropertyChanged(args) {
        this.initPlaceholderImage();
    }

    protected onActualImageScaleTypePropertyChanged(args) {
        this.initActualImageScaleType();
    }

    protected onFadeDurationPropertyChanged(args) {
        this.initFadeDuration();
    }

    protected onBackgroundPropertyChanged(args) {
        this.initBackground();
    }

    private initDrawee() {
        this.initImage();
        this.initPlaceholderImage();
        this.initActualImageScaleType();
        this.initFadeDuration();
        this.initBackground();
    }

    private initActualImageScaleType() {
        if (this._android) {
            if (this.actualImageScaleType) {
                this.updateHierarchy();
            }
        }
    }

    // TODO: refactor this
    private initImage() {
        if (this._android) {
            this._android.setImageURI(null, null);
            if (this.imageUri) {
                if (!utils.isFileOrResourcePath(this.imageUri)) {
                    this._android.setImageURI(android.net.Uri.parse(this.imageUri), null);
                }
                else {
                    var res = utils.ad.getApplicationContext().getResources();
                    if (!res) {
                        return;
                    }
                    if (!utils.isFileOrResourcePath(this.imageUri)) {
                        throw new Error("Path \"" + "\" is not a valid file or resource.");
                    }
                    var path = this.imageUri;
                    if (path.indexOf(utils.RESOURCE_PREFIX) === 0) {
                        var resName = path.substr(utils.RESOURCE_PREFIX.length);
                        var identifier = res.getIdentifier(resName, 'drawable', utils.ad.getApplication().getPackageName());
                        if (0 < identifier) {
                            var uri = new android.net.Uri.Builder()
                                .scheme(com.facebook.common.util.UriUtil.LOCAL_RESOURCE_SCHEME)
                                .path(java.lang.String.valueOf(identifier))
                                .build();
                            this._android.setImageURI(uri);
                        }
                    }
                }
            }
        }
    }

    private initPlaceholderImage() {
        if (this._android) {
            if (this.placeholderImageUri) {
                this.imageDrawable = this.getDrawable(this.placeholderImageUri);
                this.updateHierarchy();
            }
        }
    }

    private initFadeDuration() {
        if (this._android) {
            if (this.fadeDuration) {
                this.updateHierarchy();
            }
        }
    }

    private initBackground() {
        if (this._android) {
            if (this.background) {
                this.backgroundDrawable = this.getDrawable(this.background);

                this.updateHierarchy();
            }
        }
    }

    // TODO: check if this will not lead to performance overhead as it is called for each property set to the FrescoDrawee.
    // This is because some of the proeprties are settable obly from the GenericDraweeHierarchyBuilder rather than from the SimpleDraweeView itself. 
    private updateHierarchy() {
        var builder: GenericDraweeHierarchyBuilder = new GenericDraweeHierarchyBuilder();
        if (this.placeholderImageUri) {
            builder.setPlaceholderImage(this.imageDrawable);
        }

        if (this.actualImageScaleType) {
            builder.setActualImageScaleType(this.actualImageScaleType);
        }

        if (this.fadeDuration && this.fadeDuration) {
            builder.setFadeDuration(this.fadeDuration);
        }

        if (this.background && this.backgroundDrawable) {
            builder.setBackground(this.backgroundDrawable);
        }

        var hiearchy = builder.build();
        this._android.setHierarchy(hiearchy);
    }

    private getDrawable(path: string) {
        var drawable;
        var builder: GenericDraweeHierarchyBuilder = new GenericDraweeHierarchyBuilder();

        if (utils.isFileOrResourcePath(path)) {
            if (path.indexOf(utils.RESOURCE_PREFIX) === 0) {
                drawable = this.getDrawableFromResource(path);
            } else {
                drawable = this.getDrawableLocalFile(path);
            }
        }

        return drawable;
    }

    private getDrawableLocalFile(localFilePath: string) {
        var drawable;
        if (!fs) {
            fs = require("file-system");
        }

        var fileName = types.isString(localFilePath) ? localFilePath.trim() : "";
        if (fileName.indexOf("~/") === 0) {
            fileName = fs.path.join(fs.knownFolders.currentApp().path, fileName.replace("~/", ""));
        }

        drawable = android.graphics.drawable.Drawable.createFromPath(fileName);

        return drawable;
    }

    private getDrawableFromResource(resourceName: string) {
        var img = imageSource.fromResource(resourceName.substr(utils.RESOURCE_PREFIX.length));
        var drawable = new android.graphics.drawable.BitmapDrawable(utils.ad.getApplicationContext().getResources(), img.android);

        return drawable;
    }
}

class GenericDraweeHierarchyBuilder {
    private nativeBuilder: com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;

    constructor() {
        var res = application.android.context.getResources();
        this.nativeBuilder = new com.facebook.drawee.generic.GenericDraweeHierarchyBuilder(res);
    }

    public setPlaceholderImage(drawable): GenericDraweeHierarchyBuilder {
        if (!application.android) {
            return;
        }

        this.nativeBuilder.setPlaceholderImage(drawable);

        return this;
    }

    public setActualImageScaleType(scaleType: string): GenericDraweeHierarchyBuilder {
        if (!application.android) {
            return;
        }
        switch (scaleType) {
            case "center":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER);
                break;
            case "center_crop":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER_CROP);
                break;
            case "center_inside":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER_INSIDE);
                break;
            case "fit_center":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_CENTER);
                break;
            case "fit_end":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_END);
                break;
            case "fit_start":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_START);
                break;
            case "fit_xy":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_XY);
                break;
            case "matrix":
                this.nativeBuilder.setActualImageScaleType(com.facebook.drawee.drawable.ScalingUtils.ScaleType.MATRIX);
                break;
            default:
                break;
        }


        return this;
    }

    public build(): com.facebook.drawee.generic.GenericDraweeHierarchy {
        if (!application.android) {
            return;
        }

        return this.nativeBuilder.build();
    }

    public setFadeDuration(duration: number): GenericDraweeHierarchyBuilder {
        if (!application.android) {
            return;
        }

        this.nativeBuilder.setFadeDuration(duration);

        return this;
    }

    public setBackgrounds(drawables: Array<any>): GenericDraweeHierarchyBuilder {
        if (!application.android) {
            return;
        }

        // Implement

        //this.nativeBuilder.setBackgrounds(backgroundsList);

        return this;
    }

    public setBackground(drawable): GenericDraweeHierarchyBuilder {
        if (!application.android) {
            return;
        }

        this.nativeBuilder.setBackground(drawable);

        return this;
    }

    public shutDown(): void {
        this.nativeBuilder.shutDown();
    }
}