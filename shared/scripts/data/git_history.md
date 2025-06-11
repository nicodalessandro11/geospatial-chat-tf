# *Are U Query-ous?* - GIT LOGS

## 📦 Feature | 2025-06-03 | Updated API clients and database upload

- Modified the API clients for both Barcelona and Madrid in the auq_data_engine module
- Changes were made to improve the efficiency of data retrieval and handling
- Also updated the upload_to_supabase.py file to enhance the upload process to our Supabase database
- Updated the database schema in schema.sql to accommodate the new data structure

This commit aims to improve the overall data retrieval and upload process, making it more efficient and robust. These changes should significantly enhance the performance of our data engine.

## 📄 Docs | 2025-06-02 | Update README and CHANGELOG

- Updated CHANGELOG.md to reflect recent changes
- Revised shared/README.md and shared/common_lib/README.md for clarity and accuracy
- Utilized Markdown for formatting and organization

This commit aims to improve the documentation of our project, making it easier for both team members and users to understand the system. It's essential to keep our documentation up-to-date as the project evolves.

## 📄 Docs | 2025-06-02 | Update documentation and add new standards

- Updated various README files and api-design.md in auq_backend, auq_data_engine, auq_database, auq_frontend, auq_nlp, and shared/docs modules
- This was done to ensure the documentation is up-to-date and reflects the current state of the project
- Added new frontend_standards.md and supabase_integration.md in shared/docs module to provide clear guidelines and standards for frontend development and Supabase integration

This commit aims to improve the overall quality of our documentation, making it easier for new team members to understand the project and for existing members to follow the latest standards and practices.

## 📄 Docs | 2025-06-02 | Update README.md

- Modified README.md in auq_frontend
- To provide updated information and instructions for the project
- Used Markdown language for formatting

This update aims to improve the project's documentation, making it more comprehensive and user-friendly.

## 🗃️ DB | 2025-06-01 | Added new schema diagram and mascot image

- Added new Supabase schema diagram to auq_database (supabase-schema-diagram.svg)
- Introduced new mascot image in the public frontend (mascot-blue.svg)
- Files were added to enhance the visual representation of the database schema and to improve the frontend aesthetics

This commit is part of our ongoing effort to improve the documentation and user interface of our project.

## 📄 Docs | 2025-06-01 | Update README files across multiple modules

- Updated README.md files in auq_backend, auq_data_engine, auq_database, auq_frontend, auq_nlp, and shared modules
- This was done to ensure all module documentation is up-to-date and provides accurate information to the team
- Markdown was used for the documentation updates

This comprehensive update ensures that all team members have access to the most recent information about each module. This will facilitate better understanding and quicker onboarding for new team members.

## 🔐 Config | 2025-05-31 | Update et-pipeline.yml workflow

- Modified .github/workflows/et-pipeline.yml to enhance the build process
- This change was necessary to improve the efficiency and reliability of the CI/CD pipeline
- Technical details: Updated the workflow script in the YAML file

This update should result in faster, more reliable builds, helping us to deliver quality software more consistently.

## 🔐 Config | 2025-05-31 | Update et-pipeline.yml workflow

- Modified .github/workflows/et-pipeline.yml to enhance pipeline efficiency
- This update is intended to optimize the CI/CD process and reduce build time
- Technical details: modified the YAML configuration file for GitHub Actions

This change will improve the overall performance of the CI/CD pipeline, making it more efficient and reliable for future deployments.

## 🔐 Config | 2025-05-31 | Update pipeline and project configuration

- Modified the .github/workflows/et-pipeline.yml file to enhance the workflow
- Updated the pyproject.toml in auq_data_engine to ensure project dependencies are up-to-date
- Technical details: Changes were made to the pipeline configuration and Python project setup

This commit aims to improve the efficiency of the pipeline and ensure the project setup is current with the latest dependencies.

## 🛠️ Setup | 2025-05-31 | Added pyproject.toml

- Created and staged pyproject.toml file
- This file is used to manage project dependencies and configuration
- Utilized Poetry for dependency management

This is a foundational step in setting up the project environment.

## 🚀 Deploy | 2025-05-31 | Set up new GitHub Actions workflow

- Added a new workflow file: .github/workflows/et-pipeline.yml
- The new workflow aims to automate the build, test, and deployment process
- This workflow uses GitHub Actions as the CI/CD tool

This change will help in streamlining the deployment process and ensuring code quality before each deployment.

## 🐛 Fix | 2025-05-31 | Resolved issues in frontend and removed docker-compose file

- Updated compare, error, layout, signup, and visualize pages in the auq_frontend/app directory
- Enhanced admin-view component in the auq_frontend/components directory
- Removed docker-compose.yml due to redundancy and potential security risks

This commit addresses several bugs found in the frontend of our application. It also eliminates the docker-compose file that was no longer necessary. The changes should improve the overall user experience and security of our application.

## 📦 Feature | 2025-05-31 | Added time series indicators and updated signup page

- Modified 'insert_ready_point_features_madrid.json' in 'auq_data_engine/data/processed' to include new data points
- Created a new view for time series indicators in '016_add_time_series_indicators_view.sql' under 'auq_database/migrations'
- Updated 'schema.sql' in 'auq_database' to reflect the new database structure
- Enhanced the signup page in 'page.tsx' under 'auq_frontend/app/signup'

This update improves the data analysis capabilities of our system by adding time series indicators. It also enhances user registration experience on the signup page.

## 📦 Feature | 2025-05-30 | Updated frontend pages and components

- Modified various frontend pages including admin, auth, config, info, not-found, and profile pages in the auq_frontend/app directory
- Updated components including admin-view and header in the auq_frontend/components directory
- Made changes in the supabase-client.ts file in the auq_frontend/lib directory

This commit brings a significant update to the frontend part of the application, improving user experience and interface consistency. The changes also include some backend modifications for better client-server interaction.

## 📦 Feature | 2025-05-29 | Refactor frontend components and cleanup deprecated files

- Modified and refactored frontend components including admin, auth callback, chat-sidebar, compare-view, district-info, granularity-selector, map-component, map-type-selector, theme-provider, auth-context, log-user-event, supabase-client (auq_frontend/*)
- Removed deprecated components and files including education-chart, population-chart, population-density-chart, unemployment-chart, topojson-utils, placeholder-user.jpg, placeholder.jpg, globals.css, api-equivalences.sql, api-file-manifest.json, execute_sql.sql, log_user_event/index.ts, various migration files, schema.sql, seed.sql, users.md, SMTP.md, api-equivalences.sql, indicators/page.tsx, map/page.tsx (auq_frontend/*)
- The cleanup was done to remove unused files and improve the project structure, while the modifications were made to improve the functionality and user experience of the frontend components.

This commit signifies a major cleanup and refactor in the frontend codebase, making it more maintainable and efficient. It also paves the way for future feature additions and improvements.

## 🐛 Fix | 2025-05-29 | Improved user experience in password reset and comparison view

- Updated the forgot-password and reset-password pages in the auth directory to enhance user experience
- Enhanced the compare page and compare-view component to provide a more intuitive comparison interface
- Refactored the chat-sidebar, city-selector, debug-panel, and leaflet-map components for better performance and readability
- Moved the indicators page to the deprecated directory as it is no longer in use

This commit aims to improve the overall user experience of our application, particularly in the areas of password reset and data comparison. It also involves some necessary cleanup and refactoring for better code maintainability.

## 📦 Feature | 2025-05-29 | Enhanced map visualization and comparison features

- Updated compare/page.tsx and visualize-view.tsx for improved map comparison functionality
- Enhanced map visualization in map-component.tsx and leaflet-map.jsx to provide a better user experience
- Modified map-context.tsx to support new visualization and comparison features

This update significantly enhances our map visualization and comparison capabilities, providing users with a more comprehensive and intuitive interface. This is a key step towards our goal of making data exploration and comparison as seamless as possible.

## 📦 Feature | 2025-05-29 | Enhanced map view and city selector components

- Updated city-selector.tsx, compare-view.tsx, district-info.tsx, granularity-selector.tsx, leaflet-map.jsx, map-view.tsx, and map-context.tsx files in the auq_frontend/components and auq_frontend/contexts directories
- Changes were made to improve the user experience by enhancing the map view and city selector components
- The Leaflet library was used to implement the map view changes and TypeScript was used to enhance the city selector component

This update should provide a smoother and more intuitive navigation experience for users.

## 📦 Feature | 2025-05-29 | Updated compare-view and leaflet-map components

- Modified the compare-view.tsx and leaflet-map.jsx files in the auq_frontend/components directory
- The updates were made to enhance the user interface and improve the overall user experience 
- The compare-view.tsx now has an improved comparison feature and the leaflet-map.jsx has a more interactive map display

This update is a significant step towards our goal of making the application more user-friendly and interactive.

## 📦 Feature | 2025-05-29 | Enhanced Map Visualization 

- Updated various components including filter-panel.tsx, leaflet-map.jsx, map-component.tsx, map-view.tsx, point-features-toggle.tsx, and visualize-view.tsx to improve the map visualization
- The changes were made to provide a better user experience and to make the map more interactive and user-friendly
- Technical details: The changes involved updating the map-context.tsx, api-service.ts, api-types.ts, feature-styles.ts, and supabase-client.ts files

This update is a significant step towards our goal of making our application's map feature more robust and interactive. It should greatly improve the user experience and provide users with more control over the map visualization.

## 📦 Feature | 2025-05-28 | Improved Map Functionality and Added URL Param Cleanup

- Updated various map-related components and layout for better user experience (layout.tsx, city-selector.tsx, compare-view.tsx, filter-panel.tsx, leaflet-map.jsx, map-component.tsx, map-view.tsx, point-features-toggle.tsx)
- Introduced URL param cleanup component to enhance application performance and prevent unwanted issues (url-param-cleanup.tsx)
- Enhanced API service and types for better data handling and communication with backend (api-service.ts, api-types.ts)
- Added new constants and feature styles for better code readability and maintainability (constants.ts, feature-styles.ts)
- Updated Supabase client and package.json to accommodate new changes and dependencies (supabase-client.ts, package.json)

This commit brings significant improvements to the map functionality of the application, making it more user-friendly and efficient. The addition of the URL param cleanup component will also help in maintaining the application's performance and stability.

## 📦 Feature | 2025-05-28 | Implemented new info page and updated frontend components

- Added a new info page (auq_frontend/app/info/page.tsx) and updated various frontend components including layout, profile page, signup page, and more
- These changes were made to improve the user interface, enhance the user experience, and add new functionality to the application
- The changes involved modifications to the CSS (globals.css), TypeScript (page.tsx, admin-view.tsx, chat-sidebar.tsx, etc.), and JSX (leaflet-map.jsx) files

This commit represents a significant update to the frontend of the application, providing users with a more intuitive and feature-rich interface.

## 📦 Feature | 2025-05-28 | Enhanced User Authentication and Signup

- Updated auth callback and signup pages for better user experience (auq_frontend/app/auth/callback/page.tsx, auq_frontend/app/signup/page.tsx)
- Added new pages for forgot-password and reset-password functionalities (auq_frontend/app/auth/forgot-password/page.tsx, auq_frontend/app/auth/reset-password/page.tsx)
- Modified map-component, user-login-modal, and auth-context for seamless integration of new auth features (auq_frontend/components/map-component.tsx, auq_frontend/components/user-login-modal.tsx, auq_frontend/contexts/auth-context.tsx)
- Enhanced analytics logger to track new auth events (auq_frontend/lib/analytics/logger.ts)

This commit marks a significant improvement in our user authentication process, providing users with more options and a better overall experience.

## 🗃️ DB | 2025-05-27 | Update database schema and frontend components

- Modified and added new migrations in auq_database/migrations and auq_frontend/supabase/migrations
- Updated schema.sql in both auq_database and auq_frontend/supabase for database consistency
- Updated various frontend components in auq_frontend/components for better user interface
- Modified pages in auq_frontend/app for improved navigation and configuration

This commit aims to enhance the user experience by providing a more intuitive interface and ensuring data consistency across the application. The database schema has been updated to include new views, and the frontend components have been refined for better visualization and interaction. The changes also include an added data disclaimer component, emphasizing transparency in data usage.

## 📦 Feature | 2025-05-27 | Added user event logging and profile creation on signup

- Created new profile on user signup in `auq_database/migrations/015_create_profile_on_signup.sql`
- Added new page for indicators in `auq_frontend/app/indicators/page.tsx`
- Updated layout, profile page, and various components in `auq_frontend/app` and `auq_frontend/components` to integrate user event logging
- Added new analytics library in `auq_frontend/lib/analytics` for user event tracking
- Added new API endpoint for logging user events in `auq_frontend/pages/api/log-user-event.ts`
- Added new Supabase function for logging user events in `auq_frontend/supabase/functions/log_user_event/index.ts`
- Deprecated old map page in `auq_frontend/zz_deprecated/map/page.tsx`

This commit introduces user event logging to help us understand user interactions better and improve the application based on these insights. It also automatically creates a user profile on signup, enhancing the user experience.

## 📦 Feature | 2025-05-27 | Updated frontend components and configuration

- Modified admin, config pages and various components in auq_frontend/app and auq_frontend/components directories
- Changes made to enhance user interface and improve user experience
- Technical details: Updated React components, improved TypeScript typings, and revised JSX structure

This update aims to make the application more intuitive and user-friendly. With the revised UI/UX, we expect an increase in user engagement and satisfaction.

## 📦 Feature | 2025-05-27 | Major frontend and database enhancements

- Added new files and modified existing ones in the `auq_frontend` and `auq_database` directories to implement user signup, profile, and authentication features
- These changes were made to improve user experience and security on the platform
- Tools involved include Supabase for backend services and TypeScript for frontend development

This commit represents a significant milestone in the development of our platform, establishing key functionalities and setting the stage for future enhancements.

## 📦 Feature | 2025-05-26 | Enhanced Map Functionality and Supabase Integration

- Updated various map components and context for improved user experience - files affected: admin-view.tsx, city-selector.tsx, leaflet-map.jsx, map-component.tsx, map-view.tsx, map-context.tsx
- Improved API service and integrated Supabase client for efficient data handling - files affected: api-service.ts, supabase-client.ts
- Added new file manifest for Supabase API - file added: api-file-manifest.json

This commit significantly enhances the map functionality, providing users with a more interactive and responsive experience. Additionally, the integration of Supabase client improves data management and delivery.

## 📦 Feature | 2025-05-25 | Enhanced visualization and comparison views

- Updated the compare-view.tsx and visualize-view.tsx components in the auq_frontend
- Improved the user interface and functionality for better user experience
- Leveraged React's powerful state and props system to manage data and component rendering

This update will provide users with a more intuitive and interactive way to compare and visualize data. It is a significant step towards our goal of making data analysis more accessible and user-friendly.

## 📄 Docs | 2025-05-25 | Update git_history.md

- Modified the file shared/scripts/data/git_history.md
- The update was necessary to reflect the most recent changes in the project's Git history
- Markdown was used for the documentation

This update ensures that the project's Git history is up-to-date and accurately reflects the project's evolution.

## 📦 Feature | 2025-05-25 | Enhanced map and compare view components

- Updated the compare-view.tsx and map-view.tsx files in the auq_frontend/components directory.
- The changes were made to improve the user interface and provide a better user experience.
- The React library was used for the component updates, and TypeScript was used for static typing.

This update should significantly improve the usability of our application's map and comparison features.

## 🐛 Fix | 2025-05-25 | Granularity/area sync: instant, robust, no race
    
    - Updated granularity change logic in components/granularity-selector.tsx to clear area and update both state and URL in a single handler
    - Removed global/effect-based area clearing on granularity change, preventing race conditions and double updates
    - Ensured area selection persists and only clears when user changes level, never on unrelated state changes
    - Fixed issue where UI/URL could get out of sync or require double-tap to change level
    
    This checkpoint guarantees immediate, reliable sync between area, level, and URL, with a professional user experience.

## 🐛 Fix | 2025-05-25| Robust city/area state sync and URL update logic
    
    - Refactored setSelectedCity in contexts/map-context.tsx to update the URL before state, ensuring correct sync between UI, state, and URL
    - Fixed bug where changing city with an area selected would revert to the previous city due to race condition between state and URL effects
    - Removed redundant effect that double-loaded data on city/granularity change, preventing race conditions and UI flicker
    - Ensured area is always cleared and removed from URL when city changes, and that all map data, filters, and points reload as expected
    - Selecting the same city now does nothing, preventing unnecessary data clearing
    
    This checkpoint ensures robust, professional state and URL management for city/area selection, eliminating desynchronization and bounce-back issues.

## 📦 Feature | 2025-05-24 | Checkpoint: stateless area selection & highlight sync
    
    - All area selection and polygon highlight logic now fully stateless and URL-driven (components/map-view.tsx, components/leaflet-map.jsx)
    - Changing level (district/neighborhood) resets area selection and removes 'area' param from URL
    - Polygon highlight is always cleared when no area is selected, preventing stale UI
    - Lays the foundation for robust, predictable navigation and state sync across the app
    
    Checkpoint commit: ensures future features build on a clean, stateless, and user-friendly selection model.

## Checkpoint: working persistent point features state (per city/granularity) and code ready for cleanup

## 📦 Feature | 2025-05-22 | Enhanced Point Features and Improved Data Upload

- Updated `insert_ready_point_features_bcn.json` and `insert_ready_point_features_madrid.json` in `auq_data_engine/data/processed` for enhanced point features
- Modified `upload_to_supabase.py` in `auq_data_engine/upload` to improve data upload process
- Refactored `leaflet-map.jsx`, `map-component.tsx`, `point-features-toggle.tsx`, `multi-select.tsx` and `map-context.tsx` in `auq_frontend/components` and `auq_frontend/contexts` for better map interaction
- Updated `supabase-client.ts` in `auq_frontend/lib` for better database interaction

This commit enhances the point features for both Barcelona and Madrid and improves the data upload process to Supabase. It also refactors the frontend components to provide a better map interaction experience for the users.

## 📦 Feature | 2025-05-22 | Enhancements to AUQ Frontend and Database

- Added unique constraint to point features in auq_database/migrations/013_add_unique_constraint_to_point_features.sql
- Updated compare-view.tsx, district-comparison-chart.tsx, leaflet-map.jsx, map-component.tsx, and visualize-view.tsx in auq_frontend/components for improved user interface and functionality
- Introduced new UI components: multi-select.tsx and visualize-chart.tsx in auq_frontend/components/ui for better data visualization
- Modified package.json in auq_frontend for updated dependencies
- Updated seed.sql in auq_frontend/supabase for database seeding

These changes were made to improve the overall user experience and enhance the data visualization capabilities of the AUQ application. The addition of the unique constraint to the database ensures data integrity. The new UI components provide more interactive and comprehensive data visualization options.

## 📦 Feature | 2025-05-22 | Improved data loading and testing for Barcelona and Madrid

- Updated load_indicators.py and load_point_features.py in both auq_data_engine/barcelona and auq_data_engine/madrid directories, enhancing data loading process.
- Removed files_manifest.json from auq_data_engine/data, simplifying data management.
- Modified insert_ready_point_features_bcn.json and insert_ready_point_features_madrid.json in auq_data_engine/data/processed, improving data processing.
- Added example-record.json to auq_data_engine/data/raw_sample/barcelona_sample, expanding sample data.
- Adjusted test-api.ipynb in auq_data_engine/data/raw_sample/barcelona_sample, refining testing procedures.
- Revised main.py and upload_to_supabase.py in auq_data_engine, optimizing data upload functionality.
- Altered test_base_data_upload.py and test_point_features_upload.py in auq_data_engine/tests, enhancing testing capabilities.
- Modified seed.sql in auq_database, improving database seeding.

This commit aims to enhance the overall functionality of the AUQ data engine, with a focus on data loading and testing for Barcelona and Madrid. It is a significant step towards our goal of creating a more robust and efficient data processing system.

## 📦 Feature | 2025-05-22 | Update and add new data files for Barcelona and Madrid

- Updated and added new data files in `auq_data_engine/barcelona/` and `auq_data_engine/madrid/`
- Changes were made to improve the accuracy of the data and to include new data points for both cities
- Technical details: Added new JSON files and updated existing ones, deleted some CSV files, and modified Python scripts for data processing

This commit is a significant step towards improving the data quality and coverage for our Barcelona and Madrid datasets. It will enhance the accuracy of our analytics and predictions.

## 📦 Feature | 2025-05-22 | Improved Data Processing and Map Display

- Updated data processing scripts in `auq_data_engine` to handle JSON files instead of CSVs
- Added new JSON files for point features in Madrid, replacing the old CSV files in `auq_data_engine/data/raw_sample/madrid_sample/point_features/`
- Modified `leaflet-map.jsx`, `map-component.tsx`, `map-view.tsx`, and `point-features-toggle.tsx` in `auq_frontend/components` to improve map display and toggle feature
- Updated `map-context.tsx` and `supabase-client.ts` in `auq_frontend/lib` for better data handling
- Updated `package.json` in `auq_frontend` to include new dependencies
- Added new migration file `012_add_unique_constraint_to_point_features.sql` in `auq_database/migrations` to ensure data integrity
- Updated `schema.sql` and `seed.sql` in `auq_database` to reflect changes in the database structure

This commit is a significant step towards improving the overall user experience by providing more accurate data and a more interactive map display.

## 📦 Feature | 2025-05-21 | Enhanced map visualization and filtering

- Updated district-info.tsx, filter-panel.tsx, leaflet-map.jsx, and visualize-view.tsx to improve map visualization and filtering
- Changes were made to address user feedback about difficulty in using the map and filtering options
- Leveraged the Supabase client in supabase-client.ts and made necessary API changes in api-service.ts and api-types.ts

This commit significantly improves the user experience of the map feature by making it more intuitive and responsive. The filtering options are now more robust and easier to use.

## 📦 Feature | 2025-05-21 | Enhanced data loading and upload functionality

- Modified the load_indicators.py scripts for both Barcelona and Madrid in the auq_data_engine directory to improve data loading efficiency
- Updated the insert_ready_indicators_bcn.json and insert_ready_indicators_madrid.json files in the auq_data_engine/data/processed directory to align with the new data loading approach
- Renamed the data.ipynb file to manual-testing.ipynb in the auq_data_engine/data/processed directory for clearer file purpose
- Adjusted the upload_to_supabase.py script in the auq_data_engine/upload directory to ensure seamless data upload to the database
- Added a new migration file (011_replace_current_indicators_view.sql) in the auq_database/migrations directory to replace the current indicators view
- Updated the schema.sql files in both the auq_database and auq_frontend/supabase directories to reflect the latest database structure
- Tweaked the supabase-client.ts file in the auq_frontend/lib directory for better database interaction

This commit enhances the overall data loading and upload process, ensuring more efficient data handling and a smoother user experience.

## 📦 Feature | 2025-05-21 | Major update on data engine, database, and frontend components

- Updated various files in auq_data_engine, auq_database, and auq_frontend directories, reflecting changes in data processing, database schema, and frontend components
- The update aims to improve data loading, database migrations, and user interface for better user experience and data accuracy
- Involved Python for data processing, SQL for database management, and TypeScript/JavaScript for frontend development

This commit represents a significant milestone in our project. It not only enhances the overall functionality but also makes our application more user-friendly and data-driven. The changes will greatly improve the performance and reliability of our service.

## 🗃️ DB | 2025-05-20 | Added city_id to point features and updated data loading scripts

- Modified the data loading scripts for Barcelona and Madrid in 'auq_data_engine/barcelona/load_point_features.py' and 'auq_data_engine/madrid/load_point_features.py'
- This was done to accommodate the new 'city_id' field in the point features table, which was added to improve data organization and querying
- Also updated the processed data files 'insert_ready_point_features_bcn.json' and 'insert_ready_point_features_madrid.json' to include the new 'city_id' field
- Added a new migration file '007_add_city_id_to_point_features.sql' to implement the database schema change
- Updated the main database schema file 'schema.sql' to reflect the new table structure
- Added a new file 'test_supabase_connection.py' for testing the connection to our Supabase database

With this update, we can now more easily distinguish between point features from different cities in our database. This should greatly improve the efficiency of our data queries and analysis.

## 📄 Docs | 2025-05-06 | Update README.md

    - Updated README.md with latest project information
    - To provide up-to-date details about the project for new contributors and users
    - Markdown language was used for documentation

    This update ensures that the project documentation remains current and comprehensive, aiding in project understanding and onboarding.

## 🛠️ Setup | 2025-05-06 | Update .gitignore, Makefile, and READMEs; Add LICENSE and .env files

    - Updated .gitignore and Makefile for better build management
    - Revised README.md files in auq_nlp and shared directories for clearer project documentation
    - Added LICENSE file in shared directory for legal protection
    - Introduced .env.example and .env.local.example files in shared directory for environment configuration

    This commit enhances the project setup, making it easier for other developers to understand and contribute to the project. It also provides legal protection through the LICENSE file and enables better environment configuration with the addition of .env files.

## 📦 Feature | 2025-05-06 | Added new frontend components and updated documentation

    - Added new frontend components and pages to `auq_frontend/app` and `auq_frontend/components`
    - These components and pages were added to improve user interface and experience
    - Technical details: TypeScript and React were used to build these components
    - Updated `README.md` and added new documentation files in `auq_frontend/docs` to provide more context about the project structure and data pipeline.

    This commit marks a significant milestone in our frontend development, providing a more interactive and user-friendly interface. It also enhances our documentation, making it easier for new developers to understand the project.

## 📄 Docs | 2025-05-06 | Update documentation and changelog generation script

    - Updated CHANGELOG.md with recent changes and modifications
    - Modified api-design.md in auq_backend to include new API endpoints
    - Removed deprecated shared/CHANGELOG.md
    - Improved the generate_changelog.py script in shared/scripts for better changelog generation

    This commit aims to keep our documentation up-to-date and improve the way we generate our changelogs. The removal of the shared changelog is part of a broader effort to centralize our documentation.

## 🛠️ Setup | 2025-05-06 | Update Makefile

    - Modified the Makefile to include new build rules
    - This was done to streamline the build process and improve efficiency
    - Technical detail: Added rules for new dependencies and updated the ones for existing files

    This change will help in maintaining a consistent build process across the team and reduce potential issues related to build inconsistencies.

## 📄 Docs | 2025-05-06 | Update scripts and documentation

    - Modified shared/CHANGELOG.md to include recent changes
    - Moved shared/scripts/git_history.md to shared/scripts/data/git_history.md for better file organization
    - Updated shared/scripts/generate_changelog.py to improve functionality
    - Enhanced shared/scripts/git_commit_message_generator.py for more expressive commit messages

    This commit improves the documentation and script functionality, making it easier for the team to track changes and generate expressive commit messages.

## 🗃️ DB | 2024-05-05 | Major project restructuring and cleanup

    - Updated README files in auq_data_engine, auq_database, and shared/common_lib
    - Removed deprecated scripts documentation
    
    Project cleanup to remove outdated and unused files, improving maintainability and reducing confusion

## 🗃️ DB | 2025-05-05 | Updated database schema

    - Modified  to update table definitions and constraints
    - Ensures alignment with new application requirements and improves data integrity
    - Prepares the database for upcoming feature enhancements
    
    This update is part of the ongoing effort to optimize the database structure for scalability and maintainability.

## 🗃️ DB | 2025-05-05 | Fix RLS + insert issues and finalize reset flow

    - Added  to fully reset public schema while preserving PostGIS system tables
    - Updated  with missing INSERT, SELECT, and EXECUTE grants for  on all tables and functions
    - Reordered Makefile target  to fix broken line continuation and ensure seeds are applied
    - Validated Supabase auth context via  and  to confirm  usage
    - Fixed ETL upload issues by aligning schema grants and enforcing REST-based access with proper JWT
    
    This commit ensures a clean, reproducible DB setup compatible with Supabase’s RLS and service-role-based ETL workflows.

## 📦 Feature | 2025-05-04 | Added advanced filtering capabilities

    - Implemented multi-criteria filtering for map data
    - Added filter presets for common use cases
    - Created filter history to allow users to revert to previous filter states
    - Enhanced filter UI with visual indicators for active filters
    - Added export functionality for filtered datasets
    - Improved filter performance with optimized query generation

    This feature enhances the user experience by providing more powerful and flexible ways to explore geospatial data, allowing for complex queries and data exploration scenarios.

## 🐛 Fix | 2025-05-03 | Resolved mobile responsiveness issues

    - Fixed sidebar collapse behavior on small screens
    - Improved touch interactions for map controls on mobile devices
    - Adjusted font sizes and spacing for better readability on small screens
    - Fixed overflow issues in the comparison view on mobile
    - Enhanced zoom controls for touch devices
    - Implemented better handling of orientation changes

    These fixes ensure a consistent and usable experience across all device sizes, particularly improving the mobile experience for field users.

## 🚀 Performance | 2025-05-01 | Optimized map rendering and data loading

    - Implemented progressive loading for large GeoJSON datasets
    - Added level-of-detail switching based on zoom level
    - Optimized marker clustering for dense point features
    - Reduced initial load time by 40% through improved caching
    - Implemented virtualized rendering for large data tables
    - Added background data prefetching for common navigation patterns

    These optimizations significantly improve the application's performance, especially when dealing with large datasets or when used on lower-powered devices.

## 📦 Feature | 2025-04-30 | Added data export and sharing capabilities

    - Implemented export to CSV, GeoJSON, and PDF formats
    - Added shareable URL generation with current map state
    - Created embeddable map widget for external websites
    - Added social media sharing integration
    - Implemented collaborative map annotations
    - Added export history to track and manage previous exports

    This feature allows users to easily share their findings and analysis with others, enhancing collaboration and extending the utility of the platform beyond the application itself.

## 🐛 Fix | 2025-04-29 | Fixed Supabase PostGIS query with raw SQL

    - Replaced direct PostGIS function calls with raw SQL queries using the execute_sql RPC
    - Added SQL file for creating the execute_sql function in Supabase
    - Implemented indicator data fetching from the indicators table
    - Added fallback to mock geometries when PostGIS data is not available
    - Created ConnectionStatus component to check and display Supabase and PostGIS availability
    - Improved error handling and logging for Supabase queries

    This fix resolves the "Could not find a relationship between 'districts' and 'ST_AsGeoJSON'" error by using raw SQL queries instead of trying to call PostGIS functions directly in the query builder.

## 🐛 Fix | 2025-04-27 | Fixed syntax error in map-context.tsx

    - Corrected object creation syntax when updating the GeoJSON cache
    - Fixed the "Rest parameter must be last formal parameter" error
    - Updated setGeoJSONCache function to use proper object literal syntax with curly braces
    - Ensured spread operator is used correctly within object literals
    - Improved code readability and maintainability

    This fix resolves a syntax error that was preventing the application from properly caching and displaying GeoJSON data on the map.

## 🐛 Fix | 2025-04-26 | Fixed point features filtering and improved error handling

    - Updated point-features-toggle.tsx to handle both string and numeric feature types
    - Improved api-service.ts to ensure consistent data formatting for point features
    - Enhanced LeafletMap component with better error handling and coordinate validation
    - Added logging for debugging point feature rendering issues
    - Fixed icon creation in the map component

    These changes ensure that point features are properly filtered and displayed on the map, with improved error handling and debugging capabilities.

## 🐛 Fix | 2025-04-25 | Fixed point features not appearing on map

    - Updated api-service.ts to properly transform point feature data
    - Modified MapComponent to correctly filter point features by type
    - Updated LeafletMap component to properly handle markers and coordinates
    - Added error handling and logging for point feature rendering
    - Updated MapContext to include numeric feature types

    This fix resolves the issue where point features were not appearing on the map, ensuring that museums, parks, and other points of interest are correctly displayed.

## 📦 Feature | 2025-04-24 | Added admin dashboard and authentication

    - Created admin-view.tsx with interface for managing datasets and features
    - Implemented login-modal.tsx for admin authentication
    - Added auth-context.tsx for managing authentication state
    - Created mock authentication system with Supabase integration preparation
    - Added protected routes for admin functionality

    This commit adds administrative capabilities to the platform, allowing authorized users to manage datasets and monitor platform analytics.

## 🗃️ DB | 2025-04-23 | Grant SELECT on all tables and views to anon

    Ensures public read-only access for Supabase's `anon` role across the entire schema.
    This includes:
    - Granting SELECT on all existing tables in `public`
    - Granting SELECT on all existing views in `public`
    - Setting default privileges to grant SELECT on future tables and views
    
    This change improves compatibility with frontend clients that query views or reference raw tables directly.

## 🗃️ DB | 2025-04-23 | Updated database migrations and processed data files

    - Modified `Makefile` to reflect updated build or migration commands
    - Updated processed JSON files for indicators and neighbourhoods in `auq_data_engine/data/processed/`
    - Adjusted SQL migrations in `auq_database/migrations/` to refine table structures and add new features:
      - `001_create_base_tables.sql`
      - `003_add_geographical_levels.sql`
      - `004_add_indicators_and_definitions.sql`
      - `005_add_point_features.sql`
      - `007_create_views.sql`
    - Updated `auq_database/migrate_all.sql` and `seed.sql` for consistency with schema changes
    - Added new example environment variables in `shared/.env.example`
    - Untracked new frontend documentation files:
      - `auq_frontend/hierarchy.md`
      - `auq_frontend/project-structure.md`
    
    These changes improve database schema consistency, update processed data for reproducibility, and add frontend documentation for better project structure understanding.

## 📦 Feature | 2025-04-23 | Migrated frontend module into monorepo structure

    - Moved all frontend code from `auq-frontend/` into `auq_frontend/` following monorepo conventions
    - Removed deprecated folder `auq-frontend/` and its associated Dockerfile, docs, and README
    - Updated `.gitignore` to reflect new paths and structure
    
    This migration aligns the frontend with the unified monorepo architecture, improving maintainability and cross-module integration.

## 🛠️ Setup | 2025-04-23 | Fixed upsert operation in data upload

    - Added on_conflict parameter to upsert operation in upload_to_supabase.py
    - Specified unique constraint columns for indicators table
    - Ensures proper handling of duplicate records during upload
    
    This change properly implements the upsert operation to handle conflicts based on the table's unique constraints.

## 🛠️ Setup | 2025-04-23 | Standardized data directory structure in data engine

    - Updated BASE_DIR path in Barcelona and Madrid point feature loaders to use parents[1] instead of parents[2]
    - Aligned data output path with test expectations to use auq_data_engine/data/processed/
    - Ensures consistent data location and improves module encapsulation
    
    This change maintains better separation of concerns by keeping processed data within the data engine module's scope.

## 🗃️ DB | 2025-04-23 | Implemented direct Supabase access for polygon data

    - Added supabase-client.ts with functions to fetch district and neighborhood polygons directly from the database
    - Updated api-service.ts to use direct Supabase access for GeoJSON polygon data
    - Modified map-context.tsx to handle the Supabase data format for districts and neighborhoods
    - Updated LeafletMap component to properly render polygons from Supabase
    - Kept API calls for other data types while optimizing polygon data access

    This change improves performance by directly accessing static polygon data from Supabase instead of going through the API layer, while maintaining the API service for dynamic data.

## 🛠️ Setup | 2025-04-23 | Added PostgreSQL support to DevContainer

    - Enabled PostgreSQL 15 feature in `.devcontainer/devcontainer.json`
    - Ensures `psql` CLI is available by default in Codespaces
    - Supports local testing of migrations and database interaction
    - Keeps Python 3.11 and Node 20 environments for backend and frontend
    
    Improves reproducibility and simplifies setup for local/remote development in Codespaces.

## 📦 Feature | 2025-04-23 | Implemented chat sidebar and API service layer

    - Added chat-sidebar.tsx with conversational interface for geospatial queries
    - Created mock-api-responses.ts and api-adapter.ts for simulating API responses
    - Implemented api-service.ts with functions for fetching data from endpoints
    - Added api-utils.ts with utility functions for API calls
    - Created api-debug.tsx component for monitoring API calls during development

    These changes add a conversational interface for interacting with the map data and establish a service layer for future API integration.

## 📦 Feature | 2025-04-22 | Added data visualization and comparison views

    - Created visualize-view.tsx with charts for population, income, education, etc.
    - Implemented compare-view.tsx for side-by-side comparison of different areas
    - Added district-comparison-chart.tsx for visual data comparison
    - Created population-chart.tsx, income-chart.tsx and other visualization components
    - Implemented responsive layout for both desktop and mobile views

    This commit adds comprehensive data visualization capabilities, allowing users to analyze and compare urban data across different areas.

## 📦 Feature | 2025-04-21 | Added point features and filtering system

    - Implemented point-features-toggle.tsx component for toggling different types of POIs
    - Created filter-panel.tsx with sliders for filtering areas by population, income, etc.
    - Added district-info.tsx component to display detailed information about selected areas
    - Implemented caching system for GeoJSON data to improve performance
    - Added responsive sidebar layout with toggle buttons

    These features enhance the map's interactivity by allowing users to filter data and view specific points of interest, improving the overall user experience.

## 📦 Feature | 2025-04-20 | Implemented map context and basic map view

    - Created contexts/map-context.tsx with state management for city and area selection
    - Added dynamic Leaflet map component with SSR handling
    - Implemented city selector component with dropdown interface
    - Added granularity selector for switching between district and neighborhood views
    - Set up basic GeoJSON rendering capabilities for geographical data

    This implementation provides the core map visualization functionality, allowing users to select cities and view different granularity levels of geographical data.

## 🛠️ Setup | 2025-04-19 | Initial project setup with Next.js and Tailwind CSS

    - Created project structure with Next.js App Router and Tailwind CSS configuration
    - Set up shadcn/ui components for consistent UI design system
    - Added basic layout with header and navigation components
    - Configured theme provider with light/dark mode support
    - Established project typography and color scheme in globals.css

    This commit establishes the foundation for the geospatial data visualization platform with a modern tech stack and design system.

## 🛠️ Setup | 2024-04-18 | Restructured backend with FastAPI template and organized project structure

- Created backend/app directory with initial FastAPI application setup including CORS middleware
- Moved legacy code to zz_deprecated/ directory for reference while building new structure
- Added migrations directory for database schema management with Alembic
- Set up initial test structure with test_auth.py and test_indicators.py
- Added documentation for API pipeline and ETL structure

This commit establishes the foundation for the new backend architecture, providing a clean slate for building the API while preserving legacy code for reference.

## 🧪 Test | 2025-04-18 | Refactored test structure and data organization

- Renamed test files to better reflect their purpose (test_indicators.py → test_indicators_upload.py, test_point_features pytest_point_features_upload.py)
- Removed processed JSON files from version control to follow best practices
- Removed raw sample JSON files that should not be tracked
- Modified ETL ingestion script to improve data handling

This commit improves the project structure by separating test files by functionality and removing generated data files from version control.

## 2025-04-18 | 🔐 Config | 2025-04-18 | Remove system files from git tracking

- Removed .DS_Store files from git tracking
- Removed .env file from git tracking
- These files are now properly ignored via .gitignore

## 🔐 Config |2025-04-17 | Update gitignore to exclude system files

- Added .DS_Store and **/.DS_Store patterns to ignore macOS system files
- Ensures system files are not tracked in version control

## 🗃️ DB | 2025-04-17 | Processed and prepared city data for database insertion

- Generated JSON files for districts, neighbourhoods, indicators, and point features for both Barcelona and Madrid
- Updated ETL scripts for point features loading in both cities
- Reorganized data structure by moving sample data to raw_sample directory
- Updated tests to reflect new data processing changes
- Modified implementation report to document changes

This commit prepares the data in a format ready for database insertion, improving the ETL pipeline for both cities.

## 📦 Feature | 2025-04-17 | Implemented indicators ETL for Barcelona and Madrid

- Added load_indicators.py for Barcelona with support for income, population, and surface metrics
- Added load_indicators.py for Madrid with support for population and surface metrics
- Updated ingest.py to enable indicator ETL execution and testing
- Enhanced documentation with clearer ETL flow and naming conventions
- Added proper error handling and logging for indicator processing

This implementation completes the core ETL pipeline for both cities, enabling standardized processing of socioeconomic indicators across different geographical levels.

## 🔄 Refactor | 2024-03-21 | Restructured project organization and data handling

- Moved data scripts from data/scripts to scripts/etl for better organization
- Created new upload module in scripts/etl/upload for data upload functionality
- Added files_manifest.json for tracking data file metadata
- Updated documentation (SETUP.md, implementation_report.md) to reflect new structure
- Added scripts-best-practices.md for standardized development guidelines
- Cleaned up deprecated files and moved them to zz_deprecated directory
- Updated requirements.txt and Makefile to match new project structure

This restructuring improves code maintainability and sets up a more scalable foundation for future development, with clear separation of concerns between data processing, upload, and documentation.

## 📦 Feature | 2024-03-21 | Enhanced data ingestion and project structure

- Added new data loading scripts for Madrid indicators and Barcelona districts
- Updated database schema and seed files for improved data organization
- Modified ETL pipeline with new ingest_data.py and run_etl.py scripts
- Added project setup files (setup.py, requirements.txt) and test infrastructure
- Updated documentation with dataset mappings and implementation details
- Enhanced Makefile and environment configuration

This commit establishes a more robust data ingestion pipeline and project structure, enabling better data management across multiple cities and indicators.

## 📦 Feature | 2024-03-21 | Enhanced data loading pipeline for Barcelona and Madrid

- Added new indicator loading scripts (barcelona/load_indicators.py, madrid/load_indicators.py) to standardize data processing
- Added Madrid point features loading script to match Barcelona's functionality
- Modified database schema and seed files to accommodate new data structures
- Added proper Python package structure with __init__.py files in data/scripts directories
- Updated ETL pipeline documentation to reflect new changes
- Added new Barcelona raw data file (2022_atles_renda_bruta_llar.csv)
- Created shared/ directory for common utilities and functions

This commit standardizes the data loading process between Barcelona and Madrid, improving code organization and maintainability.

## 🗃️ DB | 2025-04-16 | Added database schema and datasets mapping documentation

- Created comprehensive database schema with PostGIS support for cities, districts, and neighbourhoods
- Added geographical_unit_view to unify all geographical levels
- Implemented proper permissions and RLS policies for database security
- Added support for point features and indicators with proper indexing

## 📄 Docs | 2025-04-16 | Added datasets mapping documentation for ETL process

- Created datasets_mapping.md with comprehensive list of data sources from Barcelona and Madrid
- Defined structure for point features and indicators datasets
- Added documentation for ETL script mapping and data source URLs

## 🗃️ DB | 2025-04-16 | Added PostGIS schema fixes and point features loader

- Updated  to fix SECURITY DEFINER view issue and apply correct RLS policies
- Fixed  to create  without the SECURITY DEFINER flag
- Added new script  under  to handle ETL of cultural equipment
- Adjusted  and  to support the new point features pipeline
- Updated  with initial values for  (libraries, museums, etc.)

Linter errors on Supabase dashboard are resolved and ETL for Barcelona point features is now operational.

## 🗃️ DB | 2025-04-15 | Added city_id to geographical_unit_view for clarity

- Updated database/views.sql to include `city_id` in all levels of geographical_unit_view
- Enables disambiguation of neighbourhood and district codes across different cities
- Facilitates clearer joins and lookups in future ETLs (e.g. point_features, indicators)

This change improves data traceability across geo levels and supports multi-city datasets more reliably.

## 🗃️ DB | 2025-04-15 | Normalize geo code fields and fix geographical view

- Updated all ETL scripts to store  and  as integers
- Aligned database schema to define  and  as INTEGER types
- Fixed  to cast all  fields as INTEGER to enable type-safe joins
- Ensures compatibility for future joins in ETLs for indicators and point_features using (geo_level_id, code)

This change standardizes geo code fields across the DB and ETL to prevent type mismatch errors.

## ♻️ Refactor | 2025-04-15 | Cleaned up compiled .pyc files from venv

- Deleted unnecessary cached Python files () under  for a lighter repo
- Prevented tracking of virtual environment generated files by Git
- Reflects automated clean-up process often run via 🧼 Cleaning processed files and cache...
rm -rf data/processed/*
find . -type d -name "__pycache__" -exec rm -rf {} +
rm -rf .pytest_cache
✅ Clean complete. or pre-deploy steps

This commit helps maintain a clean working directory by avoiding committed environment artifacts.

## 🛠️ Setup | 2025-04-15 | Finalized Makefile automation and documentation cleanup

- Replaced old  with standardized  for full project automation
- Added modular targets for , , , ,  and
- Created  with detailed environment and installation instructions
- Deleted outdated documents: ,
- Updated  to separate ETL and upload logic and improve flow control
- Extended  to include full commit log and project evolution

This commit wraps up the day’s refactor by enabling end-to-end reproducibility and clearer documentation for project onboarding.
!

## 🧪 Test | 2025-04-15 | Added geometry integrity tests and silenced Shapely deprecation warning

- Updated test_geometry_integrity.py to ensure geometry consistency between raw and processed files using GeoPandas and Shapely
- Added  logic for correct module resolution in pytest
- Created pytest.ini to configure test discovery and suppress shapely.geos deprecation warnings

Ensures reliable regression checks on ETL geometry outputs and prepares test suite for CI integration.

## 🗃️ DB | 2025-04-15 | Updated processed geojson exports and refined schema

- Regenerated insert_ready_*.json files for districts and neighbourhoods (Barcelona & Madrid) with correct district_id mappings
- Ensured consistency with new dynamic Supabase ID resolution during ETL
- Minor refinements to database/schema.sql to align with current pipeline structure

These changes finalize the corrected ETL output and schema alignment after refactor.

## ♻️ Refactor | 2025-04-15 | Separated ETL and upload stages for districts and neighbourhoods

- Refactored ingest_data.py to ensure districts are loaded and uploaded before neighbourhood ETL begins
- Updated upload_to_supabase.py to split upload functions into run_district_upload and run_neighbourhood_upload
- Replaced hardcoded district_id mappings in Madrid and Barcelona neighbourhood scripts with dynamic lookup from Supabase
- Improved script reliability by removing assumptions on auto-increment IDs and ensuring valid foreign key relationships

This change ensures consistent ETL pipeline execution and eliminates dependency errors during neighbourhood uploads.

## 🛠️ Setup | 2025-04-15 | Refactored Makefile with modular test commands

- Added separate targets for test_processed and test_geometry under test suite
- Clarified comments for each command including etl, clean, upload, and seed
- Enables isolated test runs and better developer experience during debugging

This update improves maintainability and transparency in running parts of the pipeline independently.

## 📦 Feature | 2025-04-15 | Added ETL scripts and processed data for BCN & Madrid

- Created `load_districts.py` and `load_neighbourhoods.py` for both Barcelona and Madrid under `data/scripts/`
- Generated `insert_ready_*.json` files with cleaned and WKT-wrapped geometries in `data/processed/`
- Ensured all districts and neighbourhoods are standardized and mapped to city IDs
- Added seed.sql to initialize PostGIS schema with all required tables and constraints
- Added `test_geometry_integrity.py` to validate WKT consistency between raw and processed files
- Includes Makefile commands (`etl`, `test`) for pipeline reproducibility

Enables complete ETL and test pipeline for loading and validating geospatial data per city.

## 📄 Docs | 2025-04-15 | Added commit message template for project documentation

## 🗃️ DB | 2025-04-15 | Added full PostGIS schema and unified views

- Added database/schema.sql with table definitions for cities, districts, neighbourhoods, indicators, and point_features
- Added database/views.sql including 'geographical_unit_view' to unify all geo levels
- Enables reproducibility and setup of Supabase schema from scratch

## 📦 Data Pipeline | 2025-04-15 | ETL pipeline + Supabase config for geographical data

- Added working .env and .env.example with Supabase URL and service key
- Removed supabase-password.txt and old placeholder files
- Created ETL scripts for Barcelona and Madrid (districts + neighbourhoods)
- Prepared upload script using supabase-py to send data from JSON to Supabase
- Updated ingest_data.py and requirements.txt to support ETL workflow
- Added real data sources: GeoJSON/TopoJSON files for BCN and MAD

This commit sets up a complete ETL-to-database pipeline for geospatial data ingestion.

## 🔐 Config | 2025-04-15 | Added Supabase credentials to .env.example and removed exposed password

- Updated .env.example with SUPABASE_URL and SUPABASE_SERVICE_KEY placeholders
- Ensured local .env includes real credentials (not committed)
- Deleted supabase-password.txt to prevent accidental exposure

## 🔐 Config | 2025-04-15 | Added safe .env.example and removed password file

- Added .env.example with Supabase placeholders
- Updated .gitignore to exclude .env from versioning
- Removed supabase-password.txt to avoid exposed credentials

## 🛠️ Setup | 2025-04-14 | Initial backend + Supabase integration setup

- Deleted placeholder .env.example (replaced with working .env file locally)
- Modified backend entrypoint and database logic (main.py, db.py)
- Updated backend/frontend Dockerfiles to align with Supabase config
- Adjusted docker-compose to reflect real env variables
- Created documentation stub for methods (docs/methods_resources.md)
- Added supabase-password.txt (⚠️ this should be ignored or encrypted later)
- Prepared requirements.txt for deployment

## 2025-04-14 | Initial project structure from CA3 template
