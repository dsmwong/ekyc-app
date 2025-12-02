import { useState, useEffect } from "react";
import { Box } from "@twilio-paste/core/box";
import { Heading } from "@twilio-paste/core/heading";
import { Button } from "@twilio-paste/button";
import { Label } from "@twilio-paste/label";
import { Input } from "@twilio-paste/input";
import { Text } from "@twilio-paste/text";
import { Combobox } from "@twilio-paste/combobox";
import { Alert } from "@twilio-paste/alert";
import { Spinner } from "@twilio-paste/spinner";
// import { HelpText } from "@twilio-paste/help-text";

import {
  Sidebar,
  SidebarHeader,
  SidebarHeaderLabel,
  SidebarHeaderIconButton,
  SidebarCollapseButton,
  SidebarBody,
  SidebarFooter,
  SidebarPushContentWrapper,
  SidebarNavigation,
  SidebarNavigationItem,
} from "@twilio-paste/core/sidebar";
import { useUID } from "@twilio-paste/core/uid-library";

import { LogoTwilioIcon } from "@twilio-paste/icons/cjs/LogoTwilioIcon";
import { ProductHomeIcon } from "@twilio-paste/icons/cjs/ProductHomeIcon";

import type { NextPage } from "next";
import Head from "next/head";

// This is dynamically loaded on the Client side - SSR disable
// import ComplianceEmbeddedWrapper from "../app/components/ComplianceEmbeddedWrapper";
import dynamic from "next/dynamic";
import {
  Form,
  FormActions,
  FormControl,
  RadioGroup,
  Radio,
} from "@twilio-paste/core";
const DynamicComplianceEmbeddedWrapper = dynamic(
  () => import("../app/components/ComplianceEmbeddedWrapper"),
  { ssr: false }
);

const SUPPORTED_COUNTRY_CODES: { [countryName: string]: string } = {
  "Afghanistan": "AF",
  "Albania": "AL",
  "Algeria": "DZ",
  "Andorra": "AD",
  "Angola": "AO",
  "Anguilla": "AI",
  "Antigua and Barbuda": "AG",
  "Argentina": "AR",
  "Armenia": "AM",
  "Aruba": "AW",
  "Australia": "AU",
  "Austria": "AT",
  "Azerbaijan": "AZ",
  "Bahamas": "BS",
  "Bahrain": "BH",
  "Bangladesh": "BD",
  "Barbados": "BB",
  "Belarus": "BY",
  "Belgium": "BE",
  "Belize": "BZ",
  "Benin": "BJ",
  "Bermuda": "BM",
  "Bhutan": "BT",
  "Bolivia": "BO",
  "Bosnia and Herzegovina": "BA",
  "Botswana": "BW",
  "Brazil": "BR",
  "Brunei": "BN",
  "Bulgaria": "BG",
  "Burkina Faso": "BF",
  "Burundi": "BI",
  "Cambodia": "KH",
  "Cameroon": "CM",
  // "Canada": "CA",
  "Cape Verde": "CV",
  "Cayman Islands": "KY",
  "Central African Republic": "CF",
  "Chad": "TD",
  "Chile": "CL",
  "China": "CN",
  "Colombia": "CO",
  "Comoros": "KM",
  "Congo": "CG",
  "Costa Rica": "CR",
  "Croatia": "HR",
  "Cyprus": "CY",
  "Czech Republic": "CZ",
  "Denmark": "DK",
  "Djibouti": "DJ",
  "Dominica": "DM",
  "Dominican Republic": "DO",
  "Ecuador": "EC",
  "Egypt": "EG",
  "El Salvador": "SV",
  "Equatorial Guinea": "GQ",
  "Estonia": "EE",
  "Ethiopia": "ET",
  "Fiji": "FJ",
  "Finland": "FI",
  "France": "FR",
  "Gabon": "GA",
  "Gambia": "GM",
  "Georgia": "GE",
  "Germany": "DE",
  "Ghana": "GH",
  "Gibraltar": "GI",
  "Greece": "GR",
  "Grenada": "GD",
  "Guatemala": "GT",
  "Guinea": "GN",
  "Guinea-Bissau": "GW",
  "Guyana": "GY",
  "Haiti": "HT",
  "Honduras": "HN",
  "Hong Kong": "HK",
  "Hungary": "HU",
  "Iceland": "IS",
  "India": "IN",
  "Indonesia": "ID",
  "Iraq": "IQ",
  "Ireland": "IE",
  "Israel": "IL",
  "Italy": "IT",
  "Jamaica": "JM",
  "Japan": "JP",
  "Jordan": "JO",
  "Kazakhstan": "KZ",
  "Kenya": "KE",
  "Kiribati": "KI",
  "Kuwait": "KW",
  "Kyrgyzstan": "KG",
  "Laos": "LA",
  "Latvia": "LV",
  "Lebanon": "LB",
  "Lesotho": "LS",
  "Liberia": "LR",
  "Libya": "LY",
  "Liechtenstein": "LI",
  "Lithuania": "LT",
  "Luxembourg": "LU",
  "Macao": "MO",
  "Madagascar": "MG",
  "Malawi": "MW",
  "Malaysia": "MY",
  "Maldives": "MV",
  "Mali": "ML",
  "Malta": "MT",
  "Marshall Islands": "MH",
  "Martinique": "MQ",
  "Mauritania": "MR",
  "Mauritius": "MU",
  "Mexico": "MX",
  "Micronesia": "FM",
  "Moldova": "MD",
  "Monaco": "MC",
  "Mongolia": "MN",
  "Montenegro": "ME",
  "Montserrat": "MS",
  "Morocco": "MA",
  "Mozambique": "MZ",
  "Myanmar": "MM",
  "Namibia": "NA",
  "Nauru": "NR",
  "Nepal": "NP",
  "Netherlands": "NL",
  "New Caledonia": "NC",
  "New Zealand": "NZ",
  "Nicaragua": "NI",
  "Niger": "NE",
  "Nigeria": "NG",
  "Niue": "NU",
  "North Macedonia": "MK",
  "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK",
  "Palau": "PW",
  "Panama": "PA",
  "Papua New Guinea": "PG",
  "Paraguay": "PY",
  "Peru": "PE",
  "Philippines": "PH",
  "Poland": "PL",
  "Portugal": "PT",
  "Qatar": "QA",
  "Romania": "RO",
  "Russia": "RU",
  "Rwanda": "RW",
  "Saint Lucia": "LC",
  "Samoa": "WS",
  "San Marino": "SM",
  "Sao Tome and Principe": "ST",
  "Saudi Arabia": "SA",
  "Senegal": "SN",
  "Serbia": "RS",
  "Seychelles": "SC",
  "Sierra Leone": "SL",
  "Singapore": "SG",
  "Slovakia": "SK",
  "Slovenia": "SI",
  "Solomon Islands": "SB",
  "South Africa": "ZA",
  "Spain": "ES",
  "Sri Lanka": "LK",
  "Sudan": "SD",
  "Suriname": "SR",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Syria": "SY",
  "Taiwan": "TW",
  "Tajikistan": "TJ",
  "Tanzania": "TZ",
  "Thailand": "TH",
  "Timor-Leste": "TL",
  "Togo": "TG",
  "Tonga": "TO",
  "Trinidad and Tobago": "TT",
  "Tunisia": "TN",
  "Turkey": "TR",
  "Turkmenistan": "TM",
  "Tuvalu": "TV",
  "Uganda": "UG",
  "Ukraine": "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  // "United States": "US",
  "Uruguay": "UY",
  "Uzbekistan": "UZ",
  "Vanuatu": "VU",
  "Venezuela": "VE",
  "Vietnam": "VN",
  "Yemen": "YE",
  "Zambia": "ZM",
  "Zimbabwe": "ZW"
};

const SUPPORTED_PHONE_NUMBER_TYPES: {[pnType: string]: string} = {
  "Mobile": "MOBILE_PHONE_NUMBER",
  "Local": "LOCAL_PHONE_NUMBER",
  "National": "NATIONAL_PHONE_NUMBER",
  "Toll Free": "TOLLFREE_PHONE_NUMBER"
};

const SUPPORTED_END_USER_TYPES: {[euType: string]: string} = {
  "Business": "BUSINESS",
  "Individual": "INDIVIDUAL"
};

const Home: NextPage = () => {
  const sidebarNavigationSkipLinkID = useUID();
  const topbarSkipLinkID = useUID();
  const mainContentSkipLinkID = useUID();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showComplianceFrame, setShowComplianceFrame] = useState(false);
  const [inquiryId, setInquiryId] = useState("");
  const [embeddableProduct, setEmbeddableProduct] = useState("");

  const [showTollFreeForm, setShowTollFreeForm] = useState(false);
  const [tollFreeNumber, setTollFreeNumber] = useState("");

  const [showRCForm, setShowRCForm] = useState(false);
  const [rcPhoneNumberType, setRCPhoneNumberType] = useState("");
  const [rcEndUserType, setRCEndUserType] = useState("");
  const [rcCountryCode, setRCCountryCode] = useState("");
  const [rcCountryItems, setRCCountryItems] = useState(Object.keys(SUPPORTED_COUNTRY_CODES));
  const [rcPhoneNumberTypeItems, setRCPhoneNumberTypeItems] = useState(Object.keys(SUPPORTED_PHONE_NUMBER_TYPES));
  const [rcEndUserTypeItems, setRCEndUserTypeItems] = useState(Object.keys(SUPPORTED_END_USER_TYPES));
  const [regulationSid, setRegulationSid] = useState("");
  const [regulationError, setRegulationError] = useState("");
  const [regulationChecking, setRegulationChecking] = useState(false);
  
  // const RC_PHONE_NUMBER_TYPE = ["mobile", "local", "national", "toll-free"];
  // const RC_PHONE_NUMBER_TYPE = ["MOBILE_PHONE_NUMBER", "LOCAL_PHONE_NUMBER", "NATIONAL_PHONE_NUMBER", "TOLFREE_PHONE_NUMBER"];
  // const RC_END_USER_TYPE = ["BUSINESS", "INDIVUIDUAL"];

  const [inquiryEndPointURL, setInquiryEndPointURL] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_URI
  );
  const [inquiryEndpointURLExample] = useState(
    "https://serverless-functions-xxxx-dev.twil.io/"
  );

  const [unverifiedTollFreeNumber, setUnverifiedTollFreeNumber] = useState([]);

  // Helper function to map internal format back to API format
  const mapPhoneNumberTypeToAPI = (internalType: string): string => {
    const mapping: {[key: string]: string} = {
      "MOBILE_PHONE_NUMBER": "Mobile",
      "LOCAL_PHONE_NUMBER": "Local",
      "NATIONAL_PHONE_NUMBER": "National",
      "TOLLFREE_PHONE_NUMBER": "Toll Free"
    };
    return mapping[internalType] || internalType;
  };

  const mapEndUserTypeToAPI = (internalType: string): string => {
    const mapping: {[key: string]: string} = {
      "BUSINESS": "Business",
      "INDIVIDUAL": "Individual"
    };
    return mapping[internalType] || internalType;
  };

  useEffect(() => {
    console.log(
      `Unverified TFN ${JSON.stringify(unverifiedTollFreeNumber, null, 2)}`
    );
    fetch(`${inquiryEndPointURL}fetchUnverifiedTFNumbers`, {
      method: "get",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Unverified Toll Free Numbers");
        console.log(data);
        setUnverifiedTollFreeNumber(data.map((item: any) => item.phoneNumber));
      })
      .catch((error) => {
        console.error("Error fetching unverified toll free numbers", error);
      });
  }, []);

  // Check regulation whenever country, phone number type, or end user type changes
  useEffect(() => {
    if (rcCountryCode && rcPhoneNumberType && rcEndUserType) {
      setRegulationChecking(true);
      setRegulationSid("");
      setRegulationError("");

      const phoneNumberType = mapPhoneNumberTypeToAPI(rcPhoneNumberType);
      const endUserType = mapEndUserTypeToAPI(rcEndUserType);

      console.log(`Checking regulation for: ${rcCountryCode}, ${phoneNumberType}, ${endUserType}`);

      fetch(`${inquiryEndPointURL}checkRegulation?countryCode=${rcCountryCode}&endUserType=${endUserType}&numberType=${encodeURIComponent(phoneNumberType)}`, {
        method: "get",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Regulation check response:", data);
          if (data.status === "ok") {
            setRegulationSid(data.sid);
            setRegulationError("");
          } else if (data.status === "not found") {
            setRegulationSid("");
            setRegulationError("No regulation found for this combination");
          } else {
            setRegulationSid("");
            setRegulationError(data.message || "Error checking regulation");
          }
        })
        .catch((error) => {
          console.error("Error checking regulation", error);
          setRegulationSid("");
          setRegulationError("Failed to check regulation");
        })
        .finally(() => {
          setRegulationChecking(false);
        });
    } else {
      // Reset when not all values are selected
      setRegulationSid("");
      setRegulationError("");
    }
  }, [rcCountryCode, rcPhoneNumberType, rcEndUserType, inquiryEndPointURL]);

  const toggleSidebarCollapsed = () => {
    return setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleComplianceFrame = () => {
    return setShowComplianceFrame(!showComplianceFrame);
  };

  return (
    <Box as="main" padding="space70">
      <Head>
        <title>Embedded Compliance for ISV Demo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar
        sidebarNavigationSkipLinkID={sidebarNavigationSkipLinkID}
        topbarSkipLinkID={topbarSkipLinkID}
        mainContentSkipLinkID={mainContentSkipLinkID}
        collapsed={sidebarCollapsed}
        variant="compact"
      >
        <SidebarHeader>
          <SidebarHeaderIconButton as="a" href="#">
            <LogoTwilioIcon
              size="sizeIcon20"
              decorative={false}
              title="Go to Console homepage"
            />
          </SidebarHeaderIconButton>
          <SidebarHeaderLabel>Twilio Demo</SidebarHeaderLabel>
        </SidebarHeader>
        <SidebarBody>
          <SidebarNavigation aria-label="main" hierarchical hideItemsOnCollapse>
            <SidebarNavigationItem
              href="https://console.twilio.com"
              icon={<ProductHomeIcon decorative />}
            >
              Twilio Console
            </SidebarNavigationItem>
          </SidebarNavigation>
        </SidebarBody>
        <SidebarFooter>
          <SidebarCollapseButton
            i18nCollapseLabel="Close sidebar"
            i18nExpandLabel="Open sidebar"
            onClick={toggleSidebarCollapsed}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarPushContentWrapper collapsed={sidebarCollapsed} variant="compact">
        {/* <Button variant="primary" onClick={toggleSidebarCollapsed}>
          Toggle Push Sidebar
        </Button> */}

        <Box marginBottom="space30">
          <Form aria-labelledby={"compliance-starter-form"}>
            <Heading as="h1" variant="heading10" id="compliance-starter-form">
              Compliance Embedded App
            </Heading>

            <FormControl>
              <Label htmlFor="inquiry_ep_url" required>
                Inquiry Host Backend URL
              </Label>
              <Input
                type="text"
                id="inquiry_ep_url"
                name="inquiry_ep_url"
                placeholder={inquiryEndpointURLExample}
                value={inquiryEndPointURL}
                onChange={(e) => {
                  setInquiryEndPointURL(e.target.value);
                }}
                required
              />
            </FormControl>
            <FormControl>
              <RadioGroup
                name="embeddable_product"
                value={embeddableProduct}
                legend="Select Embeddable Type"
                orientation="horizontal"
                onChange={(value) => {
                  console.log(value);
                  setEmbeddableProduct(value);
                  setShowComplianceFrame(false);
                  setShowTollFreeForm(
                    value === "tollFreeVerification" ? true : false
                  );
                  setShowRCForm(value === "regulatoryBundle" ? true : false);
                  setTollFreeNumber("");
                  setInquiryId("");
                  // Reset regulation check states
                  setRCCountryCode("");
                  setRCPhoneNumberType("");
                  setRCEndUserType("");
                  setRegulationSid("");
                  setRegulationError("");
                  setRegulationChecking(false);
                }}
              >
                <Radio id="customer_profile" value="customerProfile">
                  Secondary Customer Profile
                </Radio>
                <Radio id="toll_free_verification" value="tollFreeVerification">
                  Toll Free Verification
                </Radio>
                <Radio id="regulatory_bundle" value="regulatoryBundle">
                  Regulatory Bundle
                </Radio>
                <Radio
                  id="branded_calling"
                  value="brandedCalling"
                  name="Branded Calling"
                  disabled
                >
                  Branded Calling
                </Radio>
              </RadioGroup>
            </FormControl>

            {showTollFreeForm ? (
              <FormControl>
                <Box display="flex" width="size100">
                  <Combobox
                    items={unverifiedTollFreeNumber}
                    // initialSelectedItem={unverifiedTollFreeNumber[0]}
                    labelText="Select an Unverified Toll Free Number"
                    onInputValueChange={({inputValue}) => {
                        console.log('onInputValue value changed: ' + inputValue);
                      setTollFreeNumber(inputValue || "");
                    }}
                    // onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                    //     console.log('onSelect value changed: ' + e.target.value);
                    //   setTollFreeNumber(e.target.value);
                    // }}
                    required
                  />
                </Box>
              </FormControl>
            ) : (
              <></>
            )}

            {showRCForm ? (
              <FormControl>
                <Box display="flex">
                  <Box width="size40" paddingRight="space40">
                    <Combobox
                      autocomplete
                      items={rcCountryItems}
                      // initialSelectedItem={
                      //   rcCountryItems[0]
                      // }
                      labelText="Select Country"
                      onInputValueChange={({inputValue}) => {
                        console.log('value changed: ' + inputValue);
                        if (inputValue !== undefined) {
                          setRCCountryItems(
                            Object.keys(SUPPORTED_COUNTRY_CODES).filter((item) =>
                              item
                                .toLowerCase()
                                .startsWith(inputValue.toLowerCase())
                            )
                          );
                          if( SUPPORTED_COUNTRY_CODES[inputValue] ) {
                            console.log('found country code and setting to ' + SUPPORTED_COUNTRY_CODES[inputValue]);
                            setRCCountryCode(
                              SUPPORTED_COUNTRY_CODES[inputValue]
                            );
                          }
                        }
                      }}
                      // onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                      //   console.log(e.target.value);
                      //   console.log(SUPPORTED_COUNTRY_CODES[e.target.value]);
                      //   setRCCountryCode(
                      //     SUPPORTED_COUNTRY_CODES[e.target.value]
                      //   );
                      // }}
                      required
                    />
                  </Box>

                  <Box width="size40" paddingRight="space40">
                    <Combobox
                      autocomplete
                      items={rcPhoneNumberTypeItems}
                      // initialSelectedItem={RC_PHONE_NUMBER_TYPE[0]}
                      labelText="Select Phone Number Type for Bundle"
                      onInputValueChange={({inputValue}) => {
                        console.log('RC Phone Number value changed: ' + inputValue);
                        if (inputValue !== undefined) {
                          setRCPhoneNumberTypeItems(
                            Object.keys(SUPPORTED_PHONE_NUMBER_TYPES).filter((item) =>
                              item
                                .toLowerCase()
                                .startsWith(inputValue.toLowerCase())
                            )
                          );
                          
                          if( SUPPORTED_PHONE_NUMBER_TYPES[inputValue] ) {
                            console.log('found phone number type and setting to ' + SUPPORTED_PHONE_NUMBER_TYPES[inputValue]);
                            setRCPhoneNumberType(
                              SUPPORTED_PHONE_NUMBER_TYPES[inputValue]
                            );
                          }
                        }
                      }}
                      // onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                      //   console.log('Setting value: ' + e.target.value);
                      //   setRCPhoneNumberType(e.target.value);
                      // }}
                      required
                    />
                  </Box>

                  <Box width="size40">
                    <Combobox
                      autocomplete
                      items={rcEndUserTypeItems}
                      // initialSelectedItem={RC_END_USER_TYPE[0]}
                      labelText="Select End User Type for Bundle"
                      onInputValueChange={({inputValue}) => {
                        console.log('RC End User Type value changed: ' + inputValue);
                        if (inputValue !== undefined) {
                          setRCEndUserTypeItems(
                            Object.keys(SUPPORTED_END_USER_TYPES).filter((item) =>
                              item
                                .toLowerCase()
                                .startsWith(inputValue.toLowerCase())
                            )
                          );
                          
                          if( SUPPORTED_END_USER_TYPES[inputValue] ) {
                            console.log('found end user type and setting to ' + SUPPORTED_END_USER_TYPES[inputValue]);
                            setRCEndUserType(
                              SUPPORTED_END_USER_TYPES[inputValue]
                            );
                          }
                        }
                      }}
                      // onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                      //   setRCEndUserType(e.target.value);
                      // }}
                      required
                    />
                  </Box>
                </Box>
              </FormControl>
            ) : (
              <></>
            )}

            {showRCForm && (
              <Box marginTop="space60" marginBottom="space60">
                {regulationChecking && (
                  <Box display="flex" alignItems="center">
                    <Spinner size="sizeIcon20" decorative={false} title="Checking regulation" />
                    <Text as="span" marginLeft="space30">Checking regulation...</Text>
                  </Box>
                )}
                {!regulationChecking && regulationSid && (
                  <Alert variant="neutral">
                    <strong>Regulation Found</strong><br />
                    Regulation SID: <Text as="span" fontFamily="fontFamilyCode">{regulationSid}</Text>
                  </Alert>
                )}
                {!regulationChecking && regulationError && (
                  <Alert variant="error">
                    <strong>Invalid Combination</strong><br />
                    {regulationError}
                  </Alert>
                )}
              </Box>
            )}

            <FormControl>
              <Label htmlFor="inquiry_id">Inquiry ID</Label>
              <Text as="span">{inquiryId}</Text>
            </FormControl>
            <FormActions>
              <Button variant="primary" onClick={toggleComplianceFrame}>
                {showComplianceFrame ? "Hide" : "Show"} Compliance
              </Button>
            </FormActions>
          </Form>
        </Box>

        {/* This is dynamically loaded on the Client side - SSR disable */}
        {showComplianceFrame && inquiryEndPointURL ? (
          <Box
          borderStyle="solid"
          borderWidth="borderWidth10"
          borderColor="colorBorderPrimaryWeak" width="75%" height="60vh">
            <Box id="wrapper-box"height="100%">
              <DynamicComplianceEmbeddedWrapper
                  inquiryEndPointURL={inquiryEndPointURL}
                  embeddableProduct={embeddableProduct}
                  tollFreeNumber={tollFreeNumber}
                  rcPhoneNumberType={rcPhoneNumberType}
                  rcEndUserType={rcEndUserType}
                  rcCountryCode={rcCountryCode}
                  onSetInquiryId={(id: string) => {
                    setInquiryId(id);
                  }}
          />
          </Box>
          </Box>
        ) : (
          <></>
        )}
      </SidebarPushContentWrapper>
    </Box>
  );
};

export default Home;
