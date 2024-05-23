import { useState } from "react";
import { Box } from "@twilio-paste/core/box";
import { Heading } from "@twilio-paste/core/heading";
import { Button } from "@twilio-paste/button";
import { Label } from "@twilio-paste/label";
import { Input } from "@twilio-paste/input";
import { HelpText } from "@twilio-paste/help-text";


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
  SidebarNavigationItem
} from '@twilio-paste/core/sidebar';
import { useUID } from "@twilio-paste/core/uid-library";

import { LogoTwilioIcon } from "@twilio-paste/icons/cjs/LogoTwilioIcon";
import { ProductHomeIcon } from "@twilio-paste/icons/cjs/ProductHomeIcon";

import type { NextPage } from "next";
import Head from "next/head";

// This is dynamically loaded on the Client side - SSR disable
// import ComplianceEmbeddedWrapper from "../app/components/ComplianceEmbeddedWrapper";
import dynamic from 'next/dynamic';
const DynamicComplianceEmbeddedWrapper = dynamic(() => import('../app/components/ComplianceEmbeddedWrapper'), { ssr: false });

const Home: NextPage = () => {

  const sidebarNavigationSkipLinkID = useUID();
  const topbarSkipLinkID = useUID();
  const mainContentSkipLinkID = useUID();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showComplianceFrame, setShowComplianceFrame] = useState(false);

  const toggleSidebarCollapsed = () => {
    return setSidebarCollapsed(!sidebarCollapsed);
  }
  
  const toggleComplianceFrame = () => {
    return setShowComplianceFrame(!showComplianceFrame);
  }

  return (
    <Box as="main" padding="space70">
      <Head>
        <title>Paste NextJS App</title>
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
            <LogoTwilioIcon size="sizeIcon20" decorative={false} title="Go to Console homepage" />
          </SidebarHeaderIconButton>
          <SidebarHeaderLabel>Twilio Demo</SidebarHeaderLabel>
        </SidebarHeader>
        <SidebarBody>
        <SidebarNavigation aria-label="main" hierarchical hideItemsOnCollapse>
          <SidebarNavigationItem href="https://console.twilio.com" icon={<ProductHomeIcon decorative />}>
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

        <Heading as="h1" variant="heading10">
          Welcome to Demo Template
        </Heading>

        <Button variant="primary" mainContentSkipLinkID={mainContentSkipLinkID} onClick={toggleSidebarCollapsed}>
          Toggle Push Sidebar
        </Button>

        <Button variant="primary" mainContentSkipLinkID={mainContentSkipLinkID} onClick={toggleComplianceFrame}>
          Show Compliance
        </Button>

        <Label htmlFor="inquiry_id" required>Inquiry ID</Label>
        <Input type="text" aria-describedby="inquiry_id_help_text" id="inquiry_id" name="inquiry_id" placeholder="xxxx" onChange={()=>{}} required/>
        <HelpText id="inquiry_id_help_text">Inquiry ID from Server Sid Request</HelpText>

        <Label htmlFor="session_token" required>Inquiry Session Token</Label>
        <Input type="text" aria-describedby="session_token_help_text" id="session_token" name="session_token" placeholder="xxxx" onChange={()=>{}} required/>
        <HelpText id="session_token_help_text">Session Token from Server Sid Request</HelpText>

        {/* This is dynamically loaded on the Client side - SSR disable */}
        {
          showComplianceFrame ? <DynamicComplianceEmbeddedWrapper/> : <div/>
        }

      </SidebarPushContentWrapper>


    </Box>
  );
};

export default Home;
