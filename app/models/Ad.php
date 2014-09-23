<?php
class AdModel {
	//Cette page ne devrait contenir aucun html.
	public $ad;

    public function __construct() {
        $date = new DateTime();
        $settings = new stdClass();
        $settings->f480x325 = new stdClass();
        $settings->f480x325->logo = new stdClass();
        $settings->f480x325->logo->w = 237;
        $settings->f480x325->logo->h = 70;
        $settings->f480x152 = new stdClass();
        $settings->f480x152->logo = new stdClass();
        $settings->f480x152->logo->w = 150;
        $settings->f480x152->logo->h = 45;
        $settings->f230x325 = new stdClass();
        $settings->f230x325->logo = new stdClass();
        $settings->f230x325->logo->w = 150;
        $settings->f230x325->logo->h = 45;
        $settings->f230x152 = new stdClass();
        $settings->f230x152->logo = new stdClass();
        $settings->f230x152->logo->w = 135;
        $settings->f230x152->logo->h = 40;
        $settings->months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        $settings->monthsShorten = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];        
        $this->ad->new = true;
        if(isset($_POST["pre-logo"])) {
            $this->ad->new = false;
        }

        $this->ad->meta = new stdClass();
        $this->ad->meta->id = $_POST["id"];
        $this->ad->meta->noClient = $_POST["noClient"];
        $this->ad->meta->noAd = $_POST["noAd"];
        $this->ad->meta->date = date("c");
        $this->ad->meta->category = $_POST["category"];
        $this->ad->meta->format = $_POST["format"];
        $this->ad->meta->f480x325 = false;
        $this->ad->meta->f480x152 = false;
        $this->ad->meta->f230x325 = false;
        $this->ad->meta->f230x152 = false;
        $this->ad->meta->{'f' . $this->ad->meta->format} = true;
        $this->ad->meta->version = VERSION;

        $this->ad->w = intval(explode("x", $this->ad->meta->format)[0]);
        $this->ad->h = intval(explode("x", $this->ad->meta->format)[1]);

        $this->imgs = new stdClass(); 
        $this->imgs->counter = 0;
        if($this->ad->w === 480 && $this->ad->h === 325) {
            $this->imgs->w = 480;
            $this->imgs->h = 230;
        } elseif($this->ad->w === 480 && $this->ad->h === 152) {
            $this->imgs->w = 328;
            $this->imgs->h = 152;
        } elseif($this->ad->w === 230 && $this->ad->h === 325) {
            $this->imgs->w = 230;
            $this->imgs->h = 197;
        }

        $this->ad->url = new stdClass();
        $this->ad->url->root = URL;
        $this->ad->url->folder = 'temps/' . $this->ad->meta->id;
        $this->ad->url->assets = $this->ad->url->folder . '/assets/';

        $this->ad->assets = ['images/basic@2x.png', 'fonts/americantype/ameritypbol-webfont.eot', 'fonts/americantype/ameritypbol-webfont.svg', 'fonts/americantype/ameritypbol-webfont.ttf', 'fonts/americantype/ameritypbol-webfont.woff', 'fonts/americantype/ameritypmed-webfont.eot', 'fonts/americantype/ameritypmed-webfont.svg', 'fonts/americantype/ameritypmed-webfont.ttf', 'fonts/americantype/ameritypmed-webfont.woff', 'styles/fonts.css'];
        $this->createFolder();


        $this->ad->logo = new stdClass();
        if(isset($_POST["pre-logo"]) && $_POST["pre-logo"] !== "") {
            $this->ad->logo->tmp =  $_POST["pre-logo"];
            $this->ad->logo->dflt = $_POST["pre-logo"];
            list($this->ad->logo->w, $this->ad->logo->h) = getimagesize($this->ad->url->assets . $_POST["pre-logo"]);
        } else {
            $this->ad->logo->tmp =  $_FILES['logo']['tmp_name'];
            $this->ad->logo->dflt = $_FILES['logo']['name'];
            list($this->ad->logo->w, $this->ad->logo->h) = getimagesize($this->ad->logo->tmp);
        }
        $this->ad->logo->ext =  end(explode(".", $this->ad->logo->dflt));
        $this->ad->logo->name = 'logo.' . $this->ad->logo->ext;
        $this->ad->logo->path = $this->ad->url->assets . $this->ad->logo->name;
        if($this->ad->logo->w > $settings->{'f' . $this->ad->meta->format}->logo->w) { 
            $r = $this->ad->logo->w / $settings->{'f' . $this->ad->meta->format}->logo->w;
            $this->ad->logo->w = $settings->{'f' . $this->ad->meta->format}->logo->w;
            $this->ad->logo->h = $this->ad->logo->h / $r;
        }
        if($this->ad->logo->h > $settings->{'f' . $this->ad->meta->format}->logo->h) { 
            $r = $this->ad->logo->h / $settings->{'f' . $this->ad->meta->format}->logo->h;
            $this->ad->logo->h = $settings->{'f' . $this->ad->meta->format}->logo->h;
            $this->ad->logo->w = $this->ad->logo->w / $r;
        }
        if(isset($_POST["pre-logo"]) && $_POST["pre-logo"] !== "") {
            
        } else {
            move_uploaded_file($this->ad->logo->tmp, $this->ad->logo->path);
            $this->resizeCropImg( $this->ad->url->assets, $this->ad->logo->name, $this->ad->logo->w, $this->ad->logo->h );
        }
        
        $id = explode(",", $_POST["offersId"]);
        $this->ad->offers = new stdClass();
        $this->ad->offers->nbr = count($id);
        $this->ad->offers->list = [];

        $this->ad->scroller = new stdClass();
        $this->ad->scroller->w = $this->ad->w * $this->ad->offers->nbr;

        $this->ad->exist = new stdClass();
        $this->ad->exist->strapline = false;
        $this->ad->exist->mentions = false;
        $this->ad->exist->price = false;
        $this->ad->exist->date = false;
        $this->ad->exist->rating = false;
        $this->ad->exist->video = false;
        $this->ad->exist->gallery = false;
        $this->ad->exist->offersGallery = $this->ad->offers->nbr > 1 ? true : false;
        $this->ad->exist->picturesGallery = false;
        $this->ad->exist->legal = false;

        

        for($x=0; $x<$this->ad->offers->nbr; $x++) {
            $obj = new stdClass();
            /* ID */
            $obj->id = $id[$x];
            /* Index */
            $obj->index = $x + 1;
            /* Surtitre */
            if(isset($_POST[$obj->id . "_strapline"])) {
                $this->ad->exist->strapline = true;
                $strapline = nl2br($_POST[$obj->id . "_strapline"]);
                $strapline = strip_tags($strapline, '<br>');
                $obj->strapline = $strapline;
            }
            /* Titre */
            $title = nl2br($_POST[$obj->id . "_title"]);
            $title = strip_tags($title, '<br>');
            $obj->title = $title;
            /* Price */
            if(isset($_POST[$obj->id . "_price"])) {
                $this->ad->exist->price = true;
                $price = intval($_POST[$obj->id . "_price"]);
                $price = number_format($price, 0, '',' ');
                $obj->price = $price;
            }
            /* Date */
            if(isset($_POST[$obj->id . "_date"])) {
                $this->ad->exist->date = true;
                $obj->date = new stdClass();
                $obj->date->raw = $_POST[$obj->id . "_date"];
                $dateArr = explode("-", $obj->date->raw);
                $obj->date->year = intval($dateArr[0]);
                $monthArray = ($this->ad->meta->format === "480x152") ? $settings->monthsShorten[intval($dateArr[1]) -1] : $settings->months[intval($dateArr[1]) -1]; 
                $obj->date->month = $monthArray;
                $obj->date->day = intval($dateArr[2]);
                $obj->date->text = $obj->date->day ." ". $obj->date->month ." ". $obj->date->year;
                // $obj->date->text = ($this->ad->meta->format === "480x152") ? $obj->date->text."," : $obj->date->text;
            }
            /* Heure */
            if(isset($_POST[$obj->id . "_date"])) {
                $obj->time = new stdClass();
                $obj->time->raw = $_POST[$obj->id . "_time"];
                $timeArr = explode(":", $obj->time->raw);
                $obj->time->text = intval($timeArr[0]) .html_entity_decode("&thinsp;h&thinsp;"). $timeArr[1];
            }
            /* Mention Lieu */
            if(isset($_POST[$obj->id . "_place"])) {
                $obj->place = new stdClass();
                $obj->place = trim($_POST[$obj->id . "_place"]);
            }
            /* Mentions */
            $obj->mentions = [];
            /* Mention 1 */
            $mention1 = $_POST[$obj->id . "_mention_1"] === "freetext" ? $_POST[$obj->id . "_mention_1_freetext"] : $_POST[$obj->id . "_mention_1"];
            if($mention1 !== "") {
                $this->ad->exist->mentions = true;
                array_push($obj->mentions, $mention1);
            }
            /* Mention 2 */
            $mention2 = $_POST[$obj->id . "_mention_2"] === "freetext" ? $_POST[$obj->id . "_mention_2_freetext"] : $_POST[$obj->id . "_mention_2"];
            if($mention2 !== "") {
                $this->ad->exist->mentions = true;
                array_push($obj->mentions, $mention2);
            }
            /* Rating */
            $obj->rating = intval($_POST[$obj->id . "_rating"]);
            if($obj->rating > 0) {
                $this->ad->exist->rating = true;
            }
            /* Link */
            $obj->link = trim($_POST[$obj->id . "_link"]);
            /* Image(s) */
            $obj->gallery = new stdClass();
            $obj->gallery->pictures = array();

            $images = $_POST['pre-' . $obj->id . '_picture'];
            if(isset($images)) {
                $images = $_POST['pre-' . $obj->id . '_picture'];
                $images = explode(",", $images);
                foreach($images as $key => $n) {
                    $img = new stdClass();
                    $img->name = $n;
                    $img->index = $key + 1;
                    $img->path = $this->ad->url->assets . $n;

                    if($img->name !== "") {
                        array_push($obj->gallery->pictures, $img);
                    }
                }
            } else {
                $images = null;
            }
            
            foreach($_FILES[$obj->id . '_picture']['error'] as $key => $error) {
                if ($error == UPLOAD_ERR_OK) {
                    $this->imgs->counter++;
                    $img = new stdClass();
                    $img->tmp  = $_FILES[$obj->id . '_picture']['tmp_name'][$key];
                    $img->name = $_FILES[$obj->id . '_picture']['name'][$key];
                    $img->ext = pathinfo($img->name, PATHINFO_EXTENSION);
                    $img->name = "img" . $this->imgs->counter . ".jpg";
                    $img->path = $this->ad->url->assets . $img->name;

                    move_uploaded_file($img->tmp, $img->path);
                    $this->resizeCropImg( $this->ad->url->assets, $img->name, $this->imgs->w, $this->imgs->h );

                    array_push($obj->gallery->pictures, $img);
                }    
            }

            for($i=0; $i<count($obj->gallery->pictures); $i++) {
                $obj->gallery->pictures[$i]->index = $i + 1;
            }

            $obj->gallery->nbr = count($obj->gallery->pictures);
            $obj->gallery->w = $obj->gallery->nbr * $this->ad->w;
            $obj->gallery->exist = $obj->gallery->nbr > 1 ? true : false;
            if($obj->gallery->exist) {
                $this->ad->exist->picturesGallery = true;
            }
            /* Video */
            $preVideo = $_POST["pre-" . $obj->id . "_video"];
            $video = $_FILES[$obj->id . '_video'];
            if( ( isset($preVideo) &&  $preVideo !== "") || ( isset($video) && $video['size'] !== 0 ) ) {
                $obj->video = new stdClass();
                $obj->video->exist = true;
                $this->ad->exist->video = true;

                if( isset( $preVideo ) ) {
                    $obj->video->name = $_POST["pre-" . $obj->id . "_video"];
                    $obj->video->path = $this->ad->url->assets . $obj->video->name;
                    $obj->video->ext =  end(explode(".", $obj->video->name));
                } else if( isset( $video ) ) {
                    $obj->video->name = $video['name'];
                    $obj->video->tmp =  $video['tmp_name'];
                    $obj->video->path = $this->ad->url->assets . $obj->video->name;
                    $obj->video->ext =  end(explode(".", $obj->video->name));
                    array_push($this->ad->assets, $obj->video);
                }
            }
            
            /* Description */
            $description = nl2br($_POST[$obj->id . "_description"]);
            $description = strip_tags($description, '<br>');
            $obj->description = $description;
            /* Légal */
            if($_POST[$obj->id . "_legal"]) {
                $this->ad->exist->legal = true;
                $legal = nl2br($_POST[$obj->id . "_legal"]);
                $legal = strip_tags($legal, '<p><u><b><i><br>');
                $obj->legal = new stdClass();
                $obj->legal->text = $legal;
                $obj->legal->exist = $obj->legal->text == '' ? false : true;
            }

            array_push($this->ad->offers->list, $obj);
        }

        if($this->ad->exist->rating) {
            if($this->ad->meta->format === "480x325") {
                array_push($this->ad->assets, 'images/starBig@2x.png');
            } else {
                array_push($this->ad->assets, 'images/star@2x.png');
            }
        }
        if($this->ad->exist->video) {
            array_push($this->ad->assets, 'images/video@2x.png');
        }
        if($this->ad->exist->offersGallery || $this->ad->exist->picturesGallery) {
            $this->ad->exist->gallery = true;
            array_push($this->ad->assets, 'scripts/iscroll5.min.js');
        }

        if($this->ad->new) {
            $this->adAssets($this->ad->assets);
        }
        $this->adAssets($this->ad->assets);
        $this->createJsonObj();

        //print_r($this->ad);
    }

    private function createFolder() {
        rrmdir($this->ad->url->folder);
        umask(0);
        mkdir($this->ad->url->folder, 0777, true);
        mkdir($this->ad->url->assets, 0777, true);
    }

    private function adAssets($assets) {
        $folder = 'temps/' . $this->ad->meta->id . "/assets/";
        for($x=0; $x<count($assets); $x++) {
            if(!move_uploaded_file($assets[$x]->tmp, $folder . $assets[$x]->name)) {
                copy( 'public/' . $assets[$x], $folder . end( explode("/", $assets[$x]) ) );
            }
        }
    }

    private function createJsonObj() {
         $folder = 'temps/' . $this->ad->meta->id . "/assets/";
         $obj = json_encode($this->ad);
         file_put_contents($folder . '/_source.json', $obj);
    }

    private function resizeCropImg( $pFolder, $pImg, $pW, $pH ) {
        $im = new imagick();
        $im->readImage($pFolder . $pImg);

        $image = new stdClass();
        $image->dimensions = $im->getImageGeometry();
        $image->w = $image->dimensions['width'];
        $image->h = $image->dimensions['height'];
        $image->ratio = $image->w / $image->h;

        if( ( $image->w / $pW ) < ( $image->h / $pH ) ) {
            $h = ceil($pH * $image->w / $pW );
            $y = ( ($image->h - ($pH * $image->w / $pW)) / 2 );
            $im->cropImage( $image->w, $h, 0, $y );
        } else {
            $w = ceil( $pW * $image->h / $pH );
            $x = ( ($image->w - ( $pW * $image->h / $pH)) / 2 );
            $im->cropImage( $w, $image->h, $x, 0 );
        }
        $im->ThumbnailImage($pW, $pH, true);

        if($img->type === "PNG") {
            $im->setImageCompressionQuality(55);
            $im->setImageFormat('png');
        } elseif($img->type === "JPG" || $img->type === "JPEG") {
            $im->setCompressionQuality(100);
            $im->setImageFormat("jpg");
        }

        $im->writeImage($this->ad->url->folder .'/assets/'. $pImg); 
        $im->destroy();
    }
}
?>