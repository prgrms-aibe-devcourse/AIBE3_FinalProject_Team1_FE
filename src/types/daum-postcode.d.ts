/**
 * 다음(Daum) 주소 검색 API 타입 정의
 */
declare namespace daum {
  interface PostcodeData {
    zonecode: string;
    address: string;
    addressEnglish: string;
    addressType: "R" | "J";
    userSelectedType: "R" | "J";
    noSelected: "Y" | "N";
    userLanguageType: "K" | "E";
    roadAddress: string;
    roadAddressEnglish: string;
    jibunAddress: string;
    jibunAddressEnglish: string;
    autoRoadAddress: string;
    autoRoadAddressEnglish: string;
    autoJibunAddress: string;
    autoJibunAddressEnglish: string;
    buildingCode: string;
    buildingName: string;
    apartment: "Y" | "N";
    sido: string;
    sigungu: string;
    sigunguCode: string;
    bname: string;
    bcode: string;
    roadname: string;
    roadnameCode: string;
    buildingCode: string;
  }

  interface PostcodeOptions {
    oncomplete?: (data: PostcodeData) => void;
    onresize?: (size: { width: number; height: number }) => void;
    onclose?: (state: "COMPLETE_CLOSE" | "FORCE_CLOSE") => void;
    onsearch?: (data: PostcodeData) => void;
    width?: string | number;
    height?: string | number;
    maxSuggestItems?: number;
    showMoreHName?: boolean;
    hideMapBtn?: boolean;
    hideEngBtn?: boolean;
    alwaysShowEngAddr?: boolean;
    submitMode?: boolean;
    focusInput?: boolean;
    autoMapping?: boolean;
    autoMappingRoad?: boolean;
    autoMappingJibun?: boolean;
    shorthand?: boolean;
    pleaseReadGuide?: number;
    pleaseReadGuideTimer?: number;
    maxSuggestItems?: number;
    theme?: {
      bgColor?: string;
      searchBgColor?: string;
      contentBgColor?: string;
      pageBgColor?: string;
      textColor?: string;
      queryTextColor?: string;
      postcodeTextColor?: string;
      emphTextColor?: string;
      outlineColor?: string;
    };
  }

  interface PostcodeOpenOptions {
    q?: string;
    left?: number;
    top?: number;
    popupName?: string;
    popupKey?: string;
  }

  class Postcode {
    constructor(options?: PostcodeOptions);
    open(options?: PostcodeOpenOptions): void;
    embed(element: HTMLElement, options?: PostcodeOpenOptions): void;
  }
}

interface Window {
  daum?: {
    Postcode: typeof daum.Postcode;
  };
}

