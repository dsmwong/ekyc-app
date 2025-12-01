import { useState, useEffect } from "react";
import { Box } from "@twilio-paste/core/box";
import { Heading } from "@twilio-paste/core/heading";
import { Button } from "@twilio-paste/button";
import { Label } from "@twilio-paste/label";
import { Input } from "@twilio-paste/input";
import { Text } from "@twilio-paste/text";
import { Combobox } from "@twilio-paste/combobox";
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
  Select,
} from "@twilio-paste/core";
const DynamicComplianceEmbeddedWrapper = dynamic(
  () => import("../app/components/ComplianceEmbeddedWrapper"),
  { ssr: false }
);

const SUPPORTED_COUNTRY_CODES: { [countryName: string]: string } = {
  // "Afghanistan": "AF",
  // "Albania": "AL",
  // "Algeria": "DZ",
  // "Andorra": "AD",
  // "Angola": "AO",
  // "Anguilla": "AI",
  // "Antigua and Barbuda": "AG",
  // "Argentina": "AR",
  // "Armenia": "AM",
  // "Aruba": "AW",
  // "Australia": "AU",
  // "Austria": "AT",
  // "Azerbaijan": "AZ",
  // "Bahamas": "BS",
  // "Bahrain": "BH",
  // "Bangladesh": "BD",
  // "Barbados": "BB",
  // "Belarus": "BY",
  // "Belgium": "BE",
  // "Belize": "BZ",
  // "Benin": "BJ",
  // "Bermuda": "BM",
  // "Bhutan": "BT",
  // "Bolivia": "BO",
  // "Bosnia and Herzegovina": "BA",
  // "Botswana": "BW",
  // "Brazil": "BR",
  // "Brunei": "BN",
  // "Bulgaria": "BG",
  // "Burkina Faso": "BF",
  // "Burundi": "BI",
  // "Cambodia": "KH",
  // "Cameroon": "CM",
  // "Canada": "CA",
  // "Cape Verde": "CV",
  // "Cayman Islands": "KY",
  // "Central African Republic": "CF",
  // "Chad": "TD",
  // "Chile": "CL",
  // "China": "CN",
  // "Colombia": "CO",
  // "Comoros": "KM",
  // "Congo": "CG",
  // "Costa Rica": "CR",
  // "Croatia": "HR",
  // "Cyprus": "CY",
  // "Czech Republic": "CZ",
  // "Denmark": "DK",
  // "Djibouti": "DJ",
  // "Dominica": "DM",
  // "Dominican Republic": "DO",
  // "Ecuador": "EC",
  // "Egypt": "EG",
  // "El Salvador": "SV",
  // "Equatorial Guinea": "GQ",
  // "Estonia": "EE",
  // "Ethiopia": "ET",
  // "Fiji": "FJ",
  // "Finland": "FI",
  // "France": "FR",
  // "Gabon": "GA",
  // "Gambia": "GM",
  // "Georgia": "GE",
  // "Germany": "DE",
  // "Ghana": "GH",
  // "Gibraltar": "GI",
  // "Greece": "GR",
  // "Grenada": "GD",
  // "Guatemala": "GT",
  // "Guinea": "GN",
  // "Guinea-Bissau": "GW",
  // "Guyana": "GY",
  // "Haiti": "HT",
  // "Honduras": "HN",
  // "Hong Kong": "HK",
  // "Hungary": "HU",
  // "Iceland": "IS",
  // "India": "IN",
  // "Indonesia": "ID",
  // "Iraq": "IQ",
  // "Ireland": "IE",
  // "Israel": "IL",
  // "Italy": "IT",
  // "Jamaica": "JM",
  // "Japan": "JP",
  // "Jordan": "JO",
  // "Kazakhstan": "KZ",
  // "Kenya": "KE",
  // "Kiribati": "KI",
  // "Kuwait": "KW",
  // "Kyrgyzstan": "KG",
  // "Laos": "LA",
  // "Latvia": "LV",
  // "Lebanon": "LB",
  // "Lesotho": "LS",
  // "Liberia": "LR",
  // "Libya": "LY",
  // "Liechtenstein": "LI",
  // "Lithuania": "LT",
  // "Luxembourg": "LU",
  // "Macao": "MO",
  // "Madagascar": "MG",
  // "Malawi": "MW",
  // "Malaysia": "MY",
  // "Maldives": "MV",
  // "Mali": "ML",
  // "Malta": "MT",
  // "Marshall Islands": "MH",
  // "Martinique": "MQ",
  // "Mauritania": "MR",
  // "Mauritius": "MU",
  // "Mexico": "MX",
  // "Micronesia": "FM",
  // "Moldova": "MD",
  // "Monaco": "MC",
  // "Mongolia": "MN",
  // "Montenegro": "ME",
  // "Montserrat": "MS",
  // "Morocco": "MA",
  // "Mozambique": "MZ",
  // "Myanmar": "MM",
  // "Namibia": "NA",
  // "Nauru": "NR",
  // "Nepal": "NP",
  // "Netherlands": "NL",
  // "New Caledonia": "NC",
  // "New Zealand": "NZ",
  // "Nicaragua": "NI",
  // "Niger": "NE",
  // "Nigeria": "NG",
  // "Niue": "NU",
  // "North Macedonia": "MK",
  // "Norway": "NO",
  // "Oman": "OM",
  // "Pakistan": "PK",
  // "Palau": "PW",
  // "Panama": "PA",
  // "Papua New Guinea": "PG",
  // "Paraguay": "PY",
  // "Peru": "PE",
  // "Philippines": "PH",
  // "Poland": "PL",
  // "Portugal": "PT",
  // "Qatar": "QA",
  // "Romania": "RO",
  // "Russia": "RU",
  // "Rwanda": "RW",
  // "Saint Lucia": "LC",
  // "Samoa": "WS",
  // "San Marino": "SM",
  // "Sao Tome and Principe": "ST",
  // "Saudi Arabia": "SA",
  // "Senegal": "SN",
  // "Serbia": "RS",
  // "Seychelles": "SC",
  // "Sierra Leone": "SL",
  // "Singapore": "SG",
  // "Slovakia": "SK",
  // "Slovenia": "SI",
  // "Solomon Islands": "SB",
  // "South Africa": "ZA",
  // "Spain": "ES",
  // "Sri Lanka": "LK",
  // "Sudan": "SD",
  // "Suriname": "SR",
  // "Sweden": "SE",
  // "Switzerland": "CH",
  // "Syria": "SY",
  // "Taiwan": "TW",
  // "Tajikistan": "TJ",
  // "Tanzania": "TZ",
  // "Thailand": "TH",
  // "Timor-Leste": "TL",
  // "Togo": "TG",
  // "Tonga": "TO",
  // "Trinidad and Tobago": "TT",
  // "Tunisia": "TN",
  // "Turkey": "TR",
  // "Turkmenistan": "TM",
  // "Tuvalu": "TV",
  // "Uganda": "UG",
  // "Ukraine": "UA",
  // "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  // "United States": "US",
  // "Uruguay": "UY",
  // "Uzbekistan": "UZ",
  // "Vanuatu": "VU",
  // "Venezuela": "VE",
  // "Vietnam": "VN",
  // "Yemen": "YE",
  // "Zambia": "ZM",
  // "Zimbabwe": "ZW"
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

  const RC_PHONE_NUMBER_TYPE = ["mobile", "local", "national", "toll-free"];
  const RC_END_USER_TYPE = ["business", "personal"];

  const [inquiryEndPointURL, setInquiryEndPointURL] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_URI
  );
  const [inquiryEndpointURLExample] = useState(
    "https://serverless-functions-xxxx-dev.twil.io/"
  );

  const [unverifiedTollFreeNumber, setUnverifiedTollFreeNumber] = useState([]);

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
                }}
              >
                <Radio id="customer_profile" value="customerProfile">
                  Secondary Customer Profile
                </Radio>
                <Radio id="toll_free_verification" value="tollFreeVerification">
                  Toll Free Verification
                </Radio>
                <Radio id="regulatory_bundle" value="regulatoryBundle">
                  Regulatory Bundle (UK)
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
                    onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setTollFreeNumber(e.target.value);
                    }}
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
                      items={Object.keys(SUPPORTED_COUNTRY_CODES)}
                      initialSelectedItem={
                        Object.keys(SUPPORTED_COUNTRY_CODES)[0]
                      }
                      labelText="Select Country"
                      onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                        console.log(SUPPORTED_COUNTRY_CODES[e.target.value]);
                        setRCCountryCode(
                          SUPPORTED_COUNTRY_CODES[e.target.value]
                        );
                      }}
                      required
                    />
                  </Box>

                  <Box width="size40" paddingRight="space40">
                    <Combobox
                      items={RC_PHONE_NUMBER_TYPE}
                      initialSelectedItem={RC_PHONE_NUMBER_TYPE[0]}
                      labelText="Select Phone Number Type for Bundle"
                      onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setRCPhoneNumberType(e.target.value);
                      }}
                      required
                    />
                  </Box>

                  <Box width="size40">
                    <Combobox
                      items={RC_END_USER_TYPE}
                      initialSelectedItem={RC_END_USER_TYPE[0]}
                      labelText="Select End User Type for Bundle"
                      onSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setRCEndUserType(e.target.value);
                      }}
                      required
                    />
                  </Box>
                </Box>
              </FormControl>
            ) : (
              <></>
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
            <Box>
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
