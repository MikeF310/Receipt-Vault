--
-- PostgreSQL database dump
--

\restrict 4atIIKL5DpjZZLd9IdEsC2MP8hUGUqSKN8laQQpTyvW9OOZC0pGxaCIYcpIif23

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: test; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test (
    name text
);


ALTER TABLE public.test OWNER TO postgres;

--
-- Data for Name: test; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test (name) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 4atIIKL5DpjZZLd9IdEsC2MP8hUGUqSKN8laQQpTyvW9OOZC0pGxaCIYcpIif23

