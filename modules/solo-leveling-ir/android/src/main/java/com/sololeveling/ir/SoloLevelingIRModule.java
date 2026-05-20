package com.sololeveling.ir;

import android.content.Context;
import android.hardware.ConsumerIrManager;
import android.os.Build;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = "SoloLevelingIR")
public class SoloLevelingIRModule extends ReactContextBaseJavaModule {

  private final ConsumerIrManager irManager;

  public SoloLevelingIRModule(ReactApplicationContext reactContext) {
    super(reactContext);
    irManager = (ConsumerIrManager) reactContext.getSystemService(Context.CONSUMER_IR_SERVICE);
  }

  @Override
  public String getName() {
    return "SoloLevelingIR";
  }

  @ReactMethod
  public void isAvailable(Promise promise) {
    boolean available = irManager != null && irManager.hasIrEmitter();
    promise.resolve(available);
  }

  @ReactMethod
  public void transmit(double frequency, com.facebook.react.bridge.ReadableArray pattern, Promise promise) {
    if (irManager == null || !irManager.hasIrEmitter()) {
      promise.reject("IR_UNAVAILABLE", "IR blaster not available on this device");
      return;
    }

    int[] intPattern = new int[pattern.size()];
    for (int i = 0; i < pattern.size(); i++) {
      intPattern[i] = (int) pattern.getDouble(i);
    }

    try {
      irManager.transmit((int) frequency, intPattern);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("IR_TRANSMIT_FAILED", e.getMessage());
    }
  }

  @ReactMethod
  public void getCarrierFrequencies(Promise promise) {
    if (irManager == null || !irManager.hasIrEmitter()) {
      promise.reject("IR_UNAVAILABLE", "IR blaster not available");
      return;
    }
    ConsumerIrManager.CarrierFrequencyRange[] ranges = irManager.getCarrierFrequencies();
    if (ranges == null) {
      promise.resolve(null);
      return;
    }
    com.facebook.react.bridge.WritableArray arr = com.facebook.react.bridge.Arguments.createArray();
    for (ConsumerIrManager.CarrierFrequencyRange range : ranges) {
      com.facebook.react.bridge.WritableMap map = com.facebook.react.bridge.Arguments.createMap();
      map.putInt("minFrequency", range.getMinFrequency());
      map.putInt("maxFrequency", range.getMaxFrequency());
      arr.pushMap(map);
    }
    promise.resolve(arr);
  }
}
